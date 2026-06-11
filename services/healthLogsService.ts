import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export interface HealthLogItem {
  id?: string | number;
  timestamp?: unknown;
  ts?: unknown;
  createdAt?: unknown;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ClaimDeviceResponse {
  success?: boolean;
  message?: string;
  deviceId?: string;
  [key: string]: unknown;
}

export interface LatestVitalsResponse {
  deviceId: string;
  /** Unix milliseconds */
  timestamp: number;
  temperature?: number;
  roomTemperature?: number;
  moisture?: number;
  gaitAnalysis?: string;
}

const unwrapData = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const coerceDates = (payload: any): string[] => {
  const unwrapped = unwrapData<any>(payload);
  if (Array.isArray(unwrapped)) {
    return unwrapped.filter((value) => typeof value === 'string');
  }
  if (unwrapped && Array.isArray(unwrapped.dates)) {
    return unwrapped.dates.filter((value: unknown) => typeof value === 'string');
  }
  return [];
};

const coerceLogs = (payload: any): HealthLogItem[] => {
  const unwrapped = unwrapData<any>(payload);
  if (Array.isArray(unwrapped)) {
    return unwrapped as HealthLogItem[];
  }
  if (unwrapped && Array.isArray(unwrapped.logs)) {
    return unwrapped.logs as HealthLogItem[];
  }
  if (unwrapped && Array.isArray(unwrapped.items)) {
    return unwrapped.items as HealthLogItem[];
  }
  return [];
};

export const healthLogsService = {
  async claimDevice(deviceId: string): Promise<ClaimDeviceResponse> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.DEVICES.CLAIM, {
      device_id: deviceId,
    });
    return unwrapData<ClaimDeviceResponse>(response.data);
  },

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

  async getLatestVitals(deviceId: string): Promise<LatestVitalsResponse | null> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.DASHBOARD.LATEST_VITALS, {
      params: { deviceId },
    });

    const unwrapped = unwrapData<LatestVitalsResponse | null>(response.data);
    return unwrapped ?? null;
  },
};
