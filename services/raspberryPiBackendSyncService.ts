import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { deviceDataService } from '@/services/deviceDataService';
import { raspberryPiGatewayService } from '@/services/raspberryPiGatewayService';

const SYNC_HISTORY_KEY = '@pi_sync_history_v1';

type SyncHistory = Record<string, string>;

interface PiSyncPayload {
  source: 'raspberry_pi_gateway';
  syncedAt: string;
  slot: 'slot_00' | 'slot_08' | 'slot_16';
  gatewayHost: string | null;
  devices: any[];
  deviceStatuses: any[];
  latestVitals: any[];
  recentAlerts: { deviceId: string; alerts: any[] }[];
  recordingSessions: any[];
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentSlot(date = new Date()): 'slot_00' | 'slot_08' | 'slot_16' {
  const hour = date.getHours();
  if (hour < 8) return 'slot_00';
  if (hour < 16) return 'slot_08';
  return 'slot_16';
}

function getSlotKey(date = new Date()): string {
  return `${toYmd(date)}_${getCurrentSlot(date)}`;
}

async function loadHistory(): Promise<SyncHistory> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveHistory(history: SyncHistory): Promise<void> {
  await AsyncStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history));
}

async function buildPayload(): Promise<PiSyncPayload> {
  const devices = await deviceDataService.getDevices({ includeStatus: true });

  const deviceStatuses = await Promise.all(
    devices.map(async (device) => {
      try {
        const status = await deviceDataService.getDeviceStatus(device.id);
        return status;
      } catch {
        return { deviceId: device.id, status: 'unknown' };
      }
    })
  );

  const latestVitals = await Promise.all(
    devices.map(async (device) => {
      try {
        return await deviceDataService.getLatestVitals(device.id);
      } catch {
        return { deviceId: device.id, timestamp: new Date().toISOString() };
      }
    })
  );

  const recentAlerts = await Promise.all(
    devices.map(async (device) => {
      try {
        const alerts = await deviceDataService.getRecentAlerts({ deviceId: device.id, limit: 50 });
        return { deviceId: device.id, alerts };
      } catch {
        return { deviceId: device.id, alerts: [] };
      }
    })
  );

  const now = new Date();

  return {
    source: 'raspberry_pi_gateway',
    syncedAt: now.toISOString(),
    slot: getCurrentSlot(now),
    gatewayHost: raspberryPiGatewayService.gatewayHost,
    devices,
    deviceStatuses,
    latestVitals,
    recentAlerts,
    recordingSessions: raspberryPiGatewayService.getRecordingSessions(),
  };
}

export const raspberryPiBackendSyncService = {
  /**
   * Syncs Raspberry Pi aggregated data to backend.
   * Runs at most 3 times per day (00/08/16 slots, local time).
   */
  runScheduledSync: async (): Promise<{ synced: boolean; reason?: string }> => {
    if (!raspberryPiGatewayService.isConnected) {
      return { synced: false, reason: 'gateway-not-connected' };
    }

    const slotKey = getSlotKey();
    const history = await loadHistory();

    if (history[slotKey]) {
      return { synced: false, reason: 'already-synced-this-slot' };
    }

    const payload = await buildPayload();

    await apiClient.post(API_CONFIG.ENDPOINTS.SYNC.RASPBERRY_PI, payload);

    history[slotKey] = new Date().toISOString();

    // Keep only the last 14 days x 3 slots
    const sortedEntries = Object.entries(history)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 42);
    const compactHistory: SyncHistory = Object.fromEntries(sortedEntries);

    await saveHistory(compactHistory);

    return { synced: true };
  },

  /**
   * Manual sync endpoint call (ignores 3-times-per-day check).
   */
  forceSyncNow: async (): Promise<void> => {
    if (!raspberryPiGatewayService.isConnected) {
      throw new Error('Raspberry Pi gateway is not connected');
    }

    const payload = await buildPayload();
    await apiClient.post(API_CONFIG.ENDPOINTS.SYNC.RASPBERRY_PI, payload);
  },
};
