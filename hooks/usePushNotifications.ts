import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  registerForPushNotificationsAsync,
  saveTokenToBackend,
} from '@/services/notificationService';

/**
 * Registers the device for push notifications once the user is authenticated
 * and routes notification taps to the dashboard. Mount this once, high in the
 * tree (root layout).
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const router = useRouter();
  const registeredRef = useRef(false);

  // Acquire permission + push token and register it with the backend.
  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;

    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;
      registeredRef.current = true;
      try {
        await saveTokenToBackend(token);
      } catch (err) {
        registeredRef.current = false; // allow a retry on next auth change
        console.warn('[push] Failed to register token with backend', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Reset so a fresh login re-registers the token.
  useEffect(() => {
    if (!isAuthenticated) registeredRef.current = false;
  }, [isAuthenticated]);

  // Navigate to the dashboard when a notification is tapped.
  useEffect(() => {
    const goToAlerts = () => router.push('/(tabs)');

    const sub = Notifications.addNotificationResponseReceivedListener(goToAlerts);

    // Cold start: the app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) goToAlerts();
    });

    return () => sub.remove();
  }, [router]);
}
