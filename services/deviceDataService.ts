import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { raspberryPiGatewayService } from '@/services/raspberryPiGatewayService';
import {
  DashboardVitals,
  PiDevice,
  PiDeviceStatus,
  RecentAlert,
} from '@/types/raspberryPi.types';

export const deviceDataService = {
  getDevices: async (query?: { userId?: string; includeStatus?: boolean }) => {
    if (API_CONFIG.RASPBERRY_PI.ENABLED && raspberryPiGatewayService.isConnected) {
      const data = await raspberryPiGatewayService.request<{ devices: PiDevice[] }>('GET', API_CONFIG.ENDPOINTS.DEVICES.LIST, {
        query,
      });
      return data?.devices || [];
    }

    const response = await apiClient.get<{ devices: PiDevice[] }>(API_CONFIG.ENDPOINTS.DEVICES.LIST, {
      params: query,
    });
    return response.data?.devices || [];
  },

  getDeviceStatus: async (deviceId: string): Promise<PiDeviceStatus> => {
    const endpoint = API_CONFIG.ENDPOINTS.DEVICES.STATUS(deviceId);

    if (API_CONFIG.RASPBERRY_PI.ENABLED && raspberryPiGatewayService.isConnected) {
      return raspberryPiGatewayService.request<PiDeviceStatus>('GET', endpoint);
    }

    const response = await apiClient.get<PiDeviceStatus>(endpoint);
    return response.data;
  },

  getLatestVitals: async (deviceId: string): Promise<DashboardVitals> => {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.LATEST_VITALS;

    if (API_CONFIG.RASPBERRY_PI.ENABLED && raspberryPiGatewayService.isConnected) {
      return raspberryPiGatewayService.request<DashboardVitals>('GET', endpoint, {
        query: { deviceId },
      });
    }

    const response = await apiClient.get<DashboardVitals>(endpoint, {
      params: { deviceId },
    });
    return response.data;
  },

  getRecentAlerts: async (query: { deviceId: string; limit?: number }): Promise<RecentAlert[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.ALERTS.RECENT;

    if (API_CONFIG.RASPBERRY_PI.ENABLED && raspberryPiGatewayService.isConnected) {
      const data = await raspberryPiGatewayService.request<{ alerts: RecentAlert[] }>('GET', endpoint, {
        query,
      });
      return data?.alerts || [];
    }

    const response = await apiClient.get<{ alerts: RecentAlert[] }>(endpoint, {
      params: query,
    });
    return response.data?.alerts || [];
  },
};
