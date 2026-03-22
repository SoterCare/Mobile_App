import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export const alertService = {
  getRecentAlerts: async (deviceId: string, limit: number = 20) => {
    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.ALERTS.RECENT, {
      params: { deviceId, limit },
    });
    return response.data;
  },

  attendAlert: async (id: string) => {
    const response = await apiClient.patch<any>(API_CONFIG.ENDPOINTS.ALERTS.ATTEND(id));
    return response.data;
  },

  falseAlarmAlert: async (id: string) => {
    const response = await apiClient.patch<any>(API_CONFIG.ENDPOINTS.ALERTS.FALSE_ALARM(id));
    return response.data;
  },
};
