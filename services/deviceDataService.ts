import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import {
  DashboardVitals,
  PiDevice,
  PiDeviceStatus,
  RecentAlert,
} from '@/types/raspberryPi.types';

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
    const data = unwrapData<{ devices?: PiDevice[] }>(response.data);
    return data?.devices || [];
  },

  getDeviceStatus: async (deviceId: string): Promise<PiDeviceStatus> => {
    const endpoint = API_CONFIG.ENDPOINTS.DEVICES.STATUS(deviceId);
    const response = await apiClient.get<PiDeviceStatus>(endpoint);
    return unwrapData<PiDeviceStatus>(response.data);
  },

  getLatestVitals: async (deviceId: string): Promise<DashboardVitals> => {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.LATEST_VITALS;
    const response = await apiClient.get<DashboardVitals>(endpoint, {
      params: { deviceId },
    });
    return unwrapData<DashboardVitals>(response.data);
  },

  getRecentAlerts: async (query: { deviceId: string; limit?: number }): Promise<RecentAlert[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.ALERTS.RECENT;
    const response = await apiClient.get(endpoint, {
      params: query,
    });
    const data = unwrapData<any>(response.data);

    if (Array.isArray(data)) {
      return data as RecentAlert[];
    }

    if (Array.isArray(data?.alerts)) {
      return data.alerts as RecentAlert[];
    }

    if (Array.isArray(data?.data)) {
      return data.data as RecentAlert[];
    }

    return [];
  },
};
