import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

// Remembers the last token registered with the backend so we can unregister it
// on logout (while the auth token is still valid).
const PUSH_TOKEN_STORAGE_KEY = '@expo_push_token';

/**
 * Android notification channels. Critical safety alerts (fall / help call) go to
 * a MAX-importance channel that bypasses Do-Not-Disturb; everything else uses a
 * normal high-importance channel.
 */
export const CRITICAL_CHANNEL_ID = 'critical-alerts';
export const DEFAULT_CHANNEL_ID = 'alerts';

// How a notification is presented while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupAndroidChannelsAsync(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CRITICAL_CHANNEL_ID, {
    name: 'Critical Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF3B30',
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 200],
    lightColor: '#91D7E4',
  });
}

function resolveProjectId(): string | undefined {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId
  );
}

/**
 * Requests permission and returns the Expo push token for this device, or null
 * if unavailable (simulator, denied permission, or missing EAS projectId).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Remote push is only delivered to physical devices.
  if (!Device.isDevice) {
    console.warn('[push] Physical device required for push notifications');
    return null;
  }

  await setupAndroidChannelsAsync();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Notification permission not granted');
    return null;
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.warn('[push] Missing EAS projectId; cannot get Expo push token');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[push] Expo push token:', data); // copy this for testing
    return data; // e.g. "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  } catch (err) {
    console.warn('[push] Failed to fetch Expo push token', err);
    return null;
  }
}

/** Persists the device's push token against the logged-in user on the backend. */
export async function saveTokenToBackend(token: string): Promise<void> {
  await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, {
    token,
    platform: Platform.OS,
  });
  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
}

/** Removes a push token from the backend (e.g. on logout). */
export async function removeTokenFromBackend(token: string): Promise<void> {
  await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREGISTER_TOKEN, {
    token,
  });
}

/**
 * Unregisters this device's stored push token. Call this on logout BEFORE the
 * auth token is cleared, so the request is still authenticated. Failures are
 * swallowed — logout must never be blocked by a notification cleanup error.
 */
export async function unregisterPushTokenOnLogout(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (token) {
      await removeTokenFromBackend(token);
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[push] Failed to unregister token on logout', err);
  }
}
