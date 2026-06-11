import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { ActivityEvent } from '@/data/mockVitals';
import { parseToUnixMs } from '@/utils/timestamp';

const unwrapData = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const timelineService = {
  getVitalsTimeline: async (deviceId: string, metric: string, period: string, date: string, startDate?: string, endDate?: string) => {
    const params: any = { deviceId, metric, period };
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.VITALS, { params });
    return unwrapData<any>(response.data);
  },

  getEventsTimeline: async (deviceId: string, period: string, date: string, filter: string, startDate?: string, endDate?: string) => {
    const params: any = { deviceId, period, filter };
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.EVENTS, { params });
    const raw = response.data;
    const result = unwrapData<any>(raw);

    // Extract events from multiple possible response shapes
    let rawEvents: any[] = [];
    if (Array.isArray(result)) {
      rawEvents = result;
    } else if (result?.events && Array.isArray(result.events)) {
      rawEvents = result.events;
    } else if (result?.items && Array.isArray(result.items)) {
      rawEvents = result.items;
    }

    const events: ActivityEvent[] = rawEvents.map((e: any) => ({
      ...e,
      timestamp: parseToUnixMs(e.timestamp ?? e.ts ?? e.time),
    }));

    return {
      ...(result && typeof result === 'object' && !Array.isArray(result) ? result : {}),
      events,
    };
  },

  getTimelineStats: async (deviceId: string, period: string, date: string, month: string) => {
    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.STATS, {
      params: { deviceId, period, date, month },
    });
    return unwrapData<any>(response.data);
  },

  getDateOptions: async (deviceId: string, period: string) => {
    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.DATE_OPTIONS, {
      params: { deviceId, period },
    });
    return unwrapData<{ options: string[] }>(response.data);
  },

  getDismissedAlerts: async () => {
    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.DISMISSED);
    const result = unwrapData<{ items: any[] }>(response.data);
    // Field renamed from `time` (UTC string) to `timestamp` (Unix ms)
    if (result?.items && Array.isArray(result.items)) {
      result.items = result.items.map((item: any) => ({
        ...item,
        timestamp: parseToUnixMs(item.timestamp ?? item.time ?? item.createdAt),
      }));
    }
    return result;
  },

  restoreAlert: async (id: string) => {
    const response = await apiClient.post<any>(API_CONFIG.ENDPOINTS.TIMELINE.RESTORE, { id });
    return response.data;
  },

  dismissAlert: async (id: string) => {
    const response = await apiClient.post<any>(API_CONFIG.ENDPOINTS.TIMELINE.DISMISS, { id });
    return response.data;
  },
};
