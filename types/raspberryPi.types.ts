export type PiConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting';

export interface PiDevice {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | string;
  lastSeenAt?: string;
}

export interface PiDeviceStatus {
  deviceId: string;
  status: string;
  battery?: number;
  signalRssi?: number;
  connectedAt?: string;
  bands?: Array<{ name: string; status: string }>;
}

export interface DashboardVitals {
  deviceId: string;
  /** Unix milliseconds — use new Date(timestamp) to convert. */
  timestamp: number;
  temperature?: number;
  roomTemperature?: number;
  moisture?: number;
  gaitAnalysis?: string;
}

export interface RecentAlert {
  id: string;
  type: 'movement' | 'fall' | 'urine' | string;
  title: string;
  /** Unix milliseconds — use new Date(timestamp) to convert. */
  timestamp: number;
}

export interface RecordingSession {
  recordingId: string;
  deviceId?: string;
  createdAt: string;
}

export interface DeviceLog {
  id?: string;
  device_id?: string;
  deviceId?: string;
  /** Unix milliseconds — use new Date(timestamp) to convert. */
  timestamp: number;
  type?: string;
  title?: string;
  eventType?: string;
  [key: string]: unknown;
}

export interface GatewayResponse<T = unknown> {
  requestId: string;
  status: number;
  data?: T;
  error?: string;
}
