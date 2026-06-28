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

/** Device timezone offset in minutes: positive for UTC+, negative for UTC-. */
const tzOffsetMinutes = () => -new Date().getTimezoneOffset();

export const timelineService = {
  getVitalsTimeline: async (deviceId: string, metric: string, period: string, date: string, startDate?: string, endDate?: string) => {
    const params: any = { deviceId, metric, period, tzOffsetMinutes: tzOffsetMinutes() };
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.VITALS, { params });
    return unwrapData<any>(response.data);
  },

  getEventsTimeline: async (deviceId: string, period: string, date: string, filter: string, startDate?: string, endDate?: string) => {
    const params: any = { deviceId, period, filter, tzOffsetMinutes: tzOffsetMinutes() };
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
      params: { deviceId, period, date, month, tzOffsetMinutes: tzOffsetMinutes() },
    });
    return unwrapData<any>(response.data);
  },

  /**
   * Per-time gait states for a single day → change-events ({ sec, state },
   * seconds-since-local-midnight) for the 24-hour gait ring. Returns null when
   * the backend has no gait endpoint/data yet, so the caller can fall back to
   * deriving an approximation from events + vitals.
   */
  getGaitSegments: async (
    deviceId: string,
    date: string,
  ): Promise<{ sec: number; state: string }[] | null> => {
    try {
      const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.GAIT, {
        params: { deviceId, date, tzOffsetMinutes: tzOffsetMinutes() },
      });
      const result = unwrapData<any>(response.data);

      if (Array.isArray(result?.changes)) return result.changes;
      const raw: any[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.samples)
          ? result.samples
          : Array.isArray(result?.segments)
            ? result.segments
            : [];
      if (raw.length === 0) return null;

      const dayStartMs = new Date(date.replace(/\//g, '-') + 'T00:00:00').getTime();
      return raw.map((r: any) => ({
        state: r.state,
        sec:
          typeof r.sec === 'number'
            ? r.sec
            : (parseToUnixMs(r.timestamp ?? r.ts ?? r.time) - dayStartMs) / 1000,
      }));
    } catch {
      return null; // no gait endpoint yet → caller derives a fallback
    }
  },

  getDateOptions: async (deviceId: string, period: string) => {
    const response = await apiClient.get<any>(API_CONFIG.ENDPOINTS.TIMELINE.DATE_OPTIONS, {
      params: { deviceId, period, tzOffsetMinutes: tzOffsetMinutes() },
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
