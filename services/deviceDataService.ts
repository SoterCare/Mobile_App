import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import {
  DashboardVitals,
  PiDevice,
  PiDeviceStatus,
  RecentAlert,
} from '@/types/raspberryPi.types';
import { parseToUnixMs } from '@/utils/timestamp';

const unwrapData = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const deviceDataService = {
  getDevices: async (query?: { userId?: string; includeStatus?: boolean }) => {
    const response = await apiClient.get<{ devices: PiDevice[] }>(API_CONFIG.ENDPOINTS.DEVICES.LIST, {
      params: query,
    });
    const data = unwrapData<{ devices?: any[] }>(response.data);
    return (data?.devices || []).map((d: any): PiDevice => ({
      ...d,
      lastSeenAt: d.lastSeenAt != null ? parseToUnixMs(d.lastSeenAt) : null,
      latestStatus: d.latestStatus
        ? {
            ...d.latestStatus,
            connectedAt: d.latestStatus.connectedAt != null ? parseToUnixMs(d.latestStatus.connectedAt) : null,
            receivedAt: d.latestStatus.receivedAt != null ? parseToUnixMs(d.latestStatus.receivedAt) : undefined,
          }
        : undefined,
    }));
  },

  getDeviceStatus: async (deviceId: string): Promise<PiDeviceStatus> => {
    const endpoint = API_CONFIG.ENDPOINTS.DEVICES.STATUS(deviceId);
    const response = await apiClient.get<PiDeviceStatus>(endpoint);
    const raw = unwrapData<any>(response.data);
    return {
      ...raw,
      connectedAt: raw?.connectedAt != null ? parseToUnixMs(raw.connectedAt) : null,
      receivedAt: raw?.receivedAt != null ? parseToUnixMs(raw.receivedAt) : undefined,
    } as PiDeviceStatus;
  },

  getLatestVitals: async (deviceId: string): Promise<DashboardVitals> => {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.LATEST_VITALS;
    const response = await apiClient.get<DashboardVitals>(endpoint, {
      params: { deviceId },
    });
    const raw = unwrapData<any>(response.data);
    return { ...raw, timestamp: parseToUnixMs(raw?.timestamp ?? raw?.ts ?? raw?.createdAt) } as DashboardVitals;
  },

  getRecentAlerts: async (query: { deviceId: string; limit?: number }): Promise<RecentAlert[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.ALERTS.RECENT;
    const response = await apiClient.get(endpoint, {
      params: query,
    });
    const data = unwrapData<any>(response.data);

    const rawList: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.alerts)
      ? data.alerts
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return rawList.map((item) => ({
      ...item,
      timestamp: parseToUnixMs(item?.timestamp ?? item?.ts ?? item?.createdAt),
      attendedAt: item?.attendedAt != null ? parseToUnixMs(item.attendedAt) : undefined,
    })) as RecentAlert[];
  },
};
