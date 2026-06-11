/**
 * Mock data for Vitals Statistics charts and activity cards
 * Data is structured to produce curves similar to the reference screenshots
 */

export interface VitalDataPoint {
  xLabel: string;
  value: number;
}

export interface ActivityEvent {
  id: string;
  type: 'movement' | 'fall' | 'connected' | 'disconnected' | 'help_call';
  label: string;
  /** Unix milliseconds — format with toTimeStr() for display in device local timezone. */
  timestamp: number;
  deviceInfo?: string[];
}

export interface ActivityStats {
  movements: number;
  falls: number;
  urine: number;
}

// Temperature data - stays around 36-37.5°C with smooth curve
export const temperatureDataDay: VitalDataPoint[] = [
  { xLabel: '00:00', value: 36.5 },
  { xLabel: '02:00', value: 36.6 },
  { xLabel: '04:00', value: 36.7 },
  { xLabel: '06:00', value: 36.8 },
  { xLabel: '08:00', value: 37.0 },
  { xLabel: '10:00', value: 37.1 },
  { xLabel: '12:00', value: 37.0 },
  { xLabel: '14:00', value: 36.9 },
  { xLabel: '16:00', value: 36.8 },
  { xLabel: '18:00', value: 36.7 },
  { xLabel: '20:00', value: 37.2 },
  { xLabel: '21:00', value: 37.4 },
  { xLabel: '22:00', value: 37.3 },
  { xLabel: '23:59', value: 37.0 },
];

export const temperatureDataMonth: VitalDataPoint[] = [
  { xLabel: '00:00', value: 36.5 },
  { xLabel: '06:00', value: 36.8 },
  { xLabel: '12:00', value: 37.0 },
  { xLabel: '18:00', value: 36.7 },
  { xLabel: '23:59', value: 37.0 },
];

export const temperatureDataCustom: VitalDataPoint[] = temperatureDataDay;

// Compute today's midnight so mock events land at realistic hours in local time
const _todayMs = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
const _hms = (h: number, m = 0) => _todayMs + h * 3_600_000 + m * 60_000;

// Activity timeline events for Day view
export const activityEventsDay: ActivityEvent[] = [
  {
    id: '1',
    type: 'movement',
    label: 'Movement Detected',
    timestamp: _hms(23, 45),
  },
  {
    id: '2',
    type: 'fall',
    label: 'Fall Detected',
    timestamp: _hms(20, 37),
    deviceInfo: ['Wrist band online - 19:15', 'Thigh band online - 19:15'],
  },
  {
    id: '3',
    type: 'connected',
    label: 'Edge Unit Connected',
    timestamp: _hms(19, 15),
    deviceInfo: ['Wrist band offline - 19:14', 'Thigh band offline - 19:14'],
  },
  {
    id: '4',
    type: 'disconnected',
    label: 'Edge Unit Disconnected',
    timestamp: _hms(19, 14),
  },
];

// Activity stats for Month view
export const activityStatsMonth: ActivityStats = {
  movements: 13,
  falls: 4,
  urine: 31,
};

// Activity stats for Custom view
export const activityStatsCustom: ActivityStats = {
  movements: 4,
  falls: 1,
  urine: 12,
};

// Helper to get vital data based on type and period
export type VitalType = 'temp';
export type PeriodType = 'day' | 'month' | 'custom';

export const getVitalData = (vital: VitalType, period: PeriodType): VitalDataPoint[] => {
  const dataMap = {
    temp: {
      day: temperatureDataDay,
      month: temperatureDataMonth,
      custom: temperatureDataCustom,
    },
  };

  return dataMap[vital][period];
};

// Y-axis configuration for each vital type
export const vitalYAxisConfig = {
  temp: {
    label: 'Temperature (°C)',
    minValue: 36.0,
    maxValue: 37.5,
    unit: '°C',
  },
};
