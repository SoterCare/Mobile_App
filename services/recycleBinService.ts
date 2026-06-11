import apiClient from '../api/client';
import { API_CONFIG } from '../api/config/api.config';
import { parseToUnixMs } from '@/utils/timestamp';

const normalizeItems = (items: any[]): any[] =>
  items.map((item) => ({
    ...item,
    // field was renamed from `time` (UTC string) to `timestamp` (Unix ms)
    timestamp: parseToUnixMs(item.timestamp ?? item.time ?? item.createdAt),
  }));

export const recycleBinService = {
  getDismissed: async (deviceId?: string): Promise<any[]> => {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.TIMELINE.DISMISSED, {
      params: deviceId ? { deviceId } : undefined,
    });

    const data = res.data;

    if (data?.data?.items && Array.isArray(data.data.items)) return normalizeItems(data.data.items);
    if (Array.isArray(data)) return normalizeItems(data);
    if (data && Array.isArray(data.items)) return normalizeItems(data.items);
    if (data && Array.isArray(data.data)) return normalizeItems(data.data);
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