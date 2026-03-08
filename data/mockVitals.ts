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
  type: 'movement' | 'fall' | 'connected' | 'disconnected';
  label: string;
  time: string;
  deviceInfo?: string[];
}

export interface ActivityStats {
  movements: number;
  falls: number;
  urine: number;
}

// Heart rate data - produces a curve that rises, peaks, and has variations like screenshot
export const heartRateDataDay: VitalDataPoint[] = [
  { xLabel: '00:00', value: 62 },
  { xLabel: '01:00', value: 60 },
  { xLabel: '02:00', value: 58 },
  { xLabel: '03:00', value: 61 },
  { xLabel: '04:00', value: 63 },
  { xLabel: '05:00', value: 68 },
  { xLabel: '06:00', value: 72 },
  { xLabel: '07:00', value: 78 },
  { xLabel: '08:00', value: 82 },
  { xLabel: '09:00', value: 85 },
  { xLabel: '10:00', value: 88 },
  { xLabel: '11:00', value: 86 },
  { xLabel: '12:00', value: 83 },
  { xLabel: '13:00', value: 80 },
  { xLabel: '14:00', value: 76 },
  { xLabel: '15:00', value: 72 },
  { xLabel: '16:00', value: 68 },
  { xLabel: '17:00', value: 70 },
  { xLabel: '18:00', value: 75 },
  { xLabel: '19:00', value: 82 },
  { xLabel: '20:00', value: 88 },
  { xLabel: '21:00', value: 85 },
  { xLabel: '22:00', value: 78 },
  { xLabel: '23:00', value: 72 },
  { xLabel: '24:00', value: 90 },
];

export const heartRateDataMonth: VitalDataPoint[] = [
  { xLabel: '00:00', value: 62 },
  { xLabel: '03:00', value: 60 },
  { xLabel: '06:00', value: 70 },
  { xLabel: '09:00', value: 85 },
  { xLabel: '12:00', value: 83 },
  { xLabel: '15:00', value: 72 },
  { xLabel: '18:00', value: 75 },
  { xLabel: '21:00', value: 82 },
  { xLabel: '24:00', value: 90 },
];

export const heartRateDataCustom: VitalDataPoint[] = heartRateDataDay;

// SpO2 (Blood O2) data - stays high (94-99%) with gradual variations
export const spo2DataDay: VitalDataPoint[] = [
  { xLabel: '00:00', value: 95 },
  { xLabel: '02:00', value: 96 },
  { xLabel: '04:00', value: 97 },
  { xLabel: '06:00', value: 98 },
  { xLabel: '08:00', value: 98.5 },
  { xLabel: '10:00', value: 98 },
  { xLabel: '12:00', value: 97.5 },
  { xLabel: '14:00', value: 97 },
  { xLabel: '16:00', value: 96.5 },
  { xLabel: '18:00', value: 96 },
  { xLabel: '20:00', value: 97 },
  { xLabel: '22:00', value: 98 },
  { xLabel: '24:00', value: 99 },
];

export const spo2DataMonth: VitalDataPoint[] = [
  { xLabel: '00:00', value: 95 },
  { xLabel: '06:00', value: 98 },
  { xLabel: '12:00', value: 97.5 },
  { xLabel: '18:00', value: 96 },
  { xLabel: '24:00', value: 99 },
];

export const spo2DataCustom: VitalDataPoint[] = spo2DataDay;

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

// Activity timeline events for Day view
export const activityEventsDay: ActivityEvent[] = [
  {
    id: '1',
    type: 'movement',
    label: 'Movement Detected',
    time: '23:45 PM',
  },
  {
    id: '2',
    type: 'fall',
    label: 'Fall Detected',
    time: '20:37 PM',
    deviceInfo: ['Wrist band online - 19:15 PM', 'Thigh band online - 19:15 PM'],
  },
  {
    id: '3',
    type: 'connected',
    label: 'Edge Unit Connected',
    time: '19:15 PM',
    deviceInfo: ['Wrist band offline - 19:14 PM', 'Thigh band offline - 19:14 PM'],
  },
  {
    id: '4',
    type: 'disconnected',
    label: 'Edge Unit Disconnected',
    time: '19:14 PM',
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
export type VitalType = 'heart' | 'spo2' | 'temp';
export type PeriodType = 'day' | 'month' | 'custom';

export const getVitalData = (vital: VitalType, period: PeriodType): VitalDataPoint[] => {
  const dataMap = {
    heart: {
      day: heartRateDataDay,
      month: heartRateDataMonth,
      custom: heartRateDataCustom,
    },
    spo2: {
      day: spo2DataDay,
      month: spo2DataMonth,
      custom: spo2DataCustom,
    },
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
  heart: {
    label: 'Heart Rate (bpm)',
    minValue: 55,
    maxValue: 90,
    unit: 'bpm',
  },
  spo2: {
    label: 'SpO2 (%)',
    minValue: 94,
    maxValue: 99,
    unit: '%',
  },
  temp: {
    label: 'Temperature (°C)',
    minValue: 36.0,
    maxValue: 37.5,
    unit: '°C',
  },
};
