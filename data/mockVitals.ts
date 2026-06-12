/**
 * Type definitions and config for the vitals chart.
 * Mock data arrays have been removed — all chart data comes from the backend.
 */

export interface VitalDataPoint {
  xLabel: string;
  value: number | null;
}

export interface ActivityEvent {
  id: string;
  type: 'movement' | 'fall' | 'connected' | 'disconnected' | 'help_call';
  label: string;
  /** Unix milliseconds */
  timestamp: number;
  deviceInfo?: string[];
}

export interface ActivityStats {
  movements: number;
  falls: number;
  urine: number;
}

export type VitalType = 'temp' | 'roomTemp' | 'moisture';
export type MetricType = VitalType;
export type PeriodType = 'day' | 'week' | 'month' | 'custom';

export interface MetricConfig {
  label: string;
  unit: string;
  apiMetric: string;
  yAxisLabel: string;
  fallbackMin: number;
  fallbackMax: number;
}

export const METRIC_CONFIG: Record<MetricType, MetricConfig> = {
  temp: {
    label: 'Body Temp',
    unit: '°C',
    apiMetric: 'temp',
    yAxisLabel: 'Temperature (°C)',
    fallbackMin: 36,
    fallbackMax: 38,
  },
  roomTemp: {
    label: 'Room Temp',
    unit: '°C',
    apiMetric: 'roomTemp',
    yAxisLabel: 'Room Temperature (°C)',
    fallbackMin: 18,
    fallbackMax: 30,
  },
  moisture: {
    label: 'Moisture',
    unit: '%',
    apiMetric: 'moisture',
    yAxisLabel: 'Moisture (%)',
    fallbackMin: 0,
    fallbackMax: 100,
  },
};

// Kept for any remaining import references — components should use METRIC_CONFIG instead.
export const vitalYAxisConfig: Record<MetricType, { label: string; minValue: number; maxValue: number; unit: string }> = {
  temp:     { label: 'Temperature (°C)',      minValue: 36, maxValue: 38,  unit: '°C' },
  roomTemp: { label: 'Room Temperature (°C)', minValue: 18, maxValue: 30,  unit: '°C' },
  moisture: { label: 'Moisture (%)',          minValue: 0,  maxValue: 100, unit: '%'  },
};
