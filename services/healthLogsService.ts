import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export interface HealthLogItem {
  id?: string | number;
  timestamp?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

type Envelope = {
  success: boolean;
  data: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object';
};

const isEnvelope = (value: unknown): value is Envelope => {
  return isObject(value) && 'success' in value && 'data' in value;
};

const unwrapData = <T>(payload: unknown): T => {
  if (isEnvelope(payload)) {
    return payload.data as T;
  }
  return payload as T;
};

const coerceDates = (payload: unknown): string[] => {
  const unwrapped = unwrapData<unknown>(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped.filter((value) => typeof value === 'string');
  }

  if (isObject(unwrapped) && Array.isArray(unwrapped.dates)) {
    return unwrapped.dates.filter((value) => typeof value === 'string');
  }

  return [];
};

const coerceLogs = (payload: unknown): HealthLogItem[] => {
  const unwrapped = unwrapData<unknown>(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped as HealthLogItem[];
  }

  if (isObject(unwrapped) && Array.isArray(unwrapped.logs)) {
    return unwrapped.logs as HealthLogItem[];
  }

  if (isObject(unwrapped) && Array.isArray(unwrapped.items)) {
    return unwrapped.items as HealthLogItem[];
  }

  return [];
};

export const healthLogsService = {
  async getAvailableDates(): Promise<string[]> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.LOGS.DATES);
    return coerceDates(response.data).sort();
  },

  async getLogsByRange(startDate: string, endDate: string): Promise<HealthLogItem[]> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.LOGS.RANGE, {
      params: {
        startDate,
        endDate,
      },
    });
    return coerceLogs(response.data);
  },
};
