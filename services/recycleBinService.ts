import apiClient from '../api/client';
import { API_CONFIG } from '../api/config/api.config';

export const recycleBinService = {
  getDismissed: async (): Promise<any[]> => {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.TIMELINE.DISMISSED);

    const data = res.data;

    // ✅ If backend returns array directly
    if (Array.isArray(data)) return data;

    // ✅ If backend returns { success: true, items: [...] }
    if (data && Array.isArray(data.items)) return data.items;

    // ✅ fallback (avoid map crash)
    return [];
  },

  restore: async (id: string): Promise<any> => {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.TIMELINE.RESTORE, { id });
    return res.data;
  },
};