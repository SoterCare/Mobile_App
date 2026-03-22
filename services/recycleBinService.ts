import apiClient from '../api/client';
import { API_CONFIG } from '../api/config/api.config';

export const recycleBinService = {
  getDismissed: async (deviceId?: string): Promise<any[]> => {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.TIMELINE.DISMISSED, {
      params: deviceId ? { deviceId } : undefined,
    });

    const data = res.data;

    // ✅ Match { success: true, data: { items: [...] } }
    if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;

    // ✅ If backend returns array directly
    if (Array.isArray(data)) return data;

    // ✅ If backend returns { success: true, items: [...] }
    if (data && Array.isArray(data.items)) return data.items;

    // ✅ If backend returns { success: true, data: [...] }
    if (data && Array.isArray(data.data)) return data.data;

    // ✅ fallback (avoid map crash)
    return [];
  },

  restore: async (payload: { id: string }): Promise<any> => {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.TIMELINE.RESTORE, {
      id: payload.id,
    });
    return res.data;
  },

  dismiss: async (payload: { id: string }): Promise<any> => {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.TIMELINE.DISMISS, {
      id: payload.id,
    });
    return res.data;
  },
};