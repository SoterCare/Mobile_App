import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export const alertService = {
  /**
   * Mark an alert as attended
   * Calls PATCH /alerts/:id/attend
   */
  attendAlert: async (id: string) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.ALERTS.ATTEND(id));
    return response.data;
  },

  /**
   * Mark an alert as a false alarm
   * Calls PATCH /alerts/:id/false-alarm
   */
  markFalseAlarm: async (id: string) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.ALERTS.FALSE_ALARM(id));
    return response.data;
  },
};
