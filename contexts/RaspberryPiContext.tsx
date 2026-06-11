import React, {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { deviceDataService } from '@/services/deviceDataService';
import { healthLogsService, HealthLogItem } from '@/services/healthLogsService';
import { useAuth } from '@/contexts/AuthContext';
import {
  DeviceLog,
  DashboardVitals,
  PiConnectionState,
  PiDevice,
  RecentAlert,
} from '@/types/raspberryPi.types';
import { parseToUnixMs } from '@/utils/timestamp';

interface RaspberryPiContextType {
  connectionState: PiConnectionState;
  devices: PiDevice[];
  selectedDeviceId: string | null;
  availableLogDates: string[];
  historicalLogs: DeviceLog[];
  liveLogs: DeviceLog[];
  isLoadingLogs: boolean;
  logsError: string | null;
  latestVitals: DashboardVitals | null;
  recentAlerts: RecentAlert[];
  lastError: string | null;
  claimDevice: (deviceId: string) => Promise<void>;
  loadAvailableLogDates: () => Promise<void>;
  loadLogsByRange: (startDate: string, endDate: string) => Promise<void>;
  scanAndConnect: () => Promise<void>;
  disconnect: () => void;
  refreshDevices: () => Promise<void>;
  refreshLatestVitals: () => Promise<void>;
  refreshRecentAlerts: () => Promise<void>;
  setSelectedDeviceId: (deviceId: string) => void;
}

const RaspberryPiContext = createContext<RaspberryPiContextType | undefined>(undefined);

export function RaspberryPiProvider({ children }: { children: ReactNode }) {
  const { signOut, isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<PiConnectionState>('disconnected');
  const [devices, setDevices] = useState<PiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [availableLogDates, setAvailableLogDates] = useState<string[]>([]);
  const [historicalLogs, setHistoricalLogs] = useState<DeviceLog[]>([]);
  const [liveLogs, setLiveLogs] = useState<DeviceLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [latestVitals, setLatestVitals] = useState<DashboardVitals | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const parseApiError = useCallback((error: any, fallback: string) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status === 401) {
      signOut();
      return 'Session expired. Please sign in again.';
    }

    if (status === 400 || status === 403) {
      return message || fallback;
    }

    return fallback;
  }, [signOut]);

  const toDeviceLog = useCallback((log: HealthLogItem | DeviceLog): DeviceLog => {
    const deviceId = String((log as any).device_id || (log as any).deviceId || '');
    const rawTimestamp = (log as any).timestamp ?? (log as any).ts ?? (log as any).createdAt;
    const timestamp = parseToUnixMs(rawTimestamp);
    const id = (log as any).id ? String((log as any).id) : undefined;
    const type = String((log as any).type || (log as any).eventType || ((log as any).fallAlert ? 'fall' : 'movement'));
    const title = String((log as any).title || (log as any).message || ((log as any).fallAlert ? 'Fall Alert' : 'Log ingested'));

    return {
      ...log,
      id,
      device_id: deviceId,
      deviceId,
      timestamp,
      type,
      title,
    };
  }, []);

  const dedupeLogs = useCallback((logs: DeviceLog[]) => {
    const map = new Map<string, DeviceLog>();
    logs.forEach((item) => {
      const normalized = toDeviceLog(item);
      const key = [
        normalized.device_id || normalized.deviceId || 'unknown-device',
        normalized.timestamp,
        normalized.id || 'no-id',
      ].join('::');
      map.set(key, normalized);
    });

    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [toDeviceLog]);

  const refreshDevices = useCallback(async () => {
    if (!isAuthenticated) {
      setDevices([]);
      return;
    }

    try {
      const list = await deviceDataService.getDevices({ includeStatus: true });
      setDevices(list);
      setConnectionState('connected');

      if (!selectedDeviceId && list.length > 0) {
        setSelectedDeviceId(list[0].id);
      }
      setLastError(null);
    } catch (error) {
      setDevices([]);
      setConnectionState('disconnected');
      setLastError(parseApiError(error, 'Failed to load devices'));
    }
  }, [isAuthenticated, parseApiError, selectedDeviceId]);

  const refreshLatestVitals = useCallback(async () => {
    if (!selectedDeviceId || !isAuthenticated) return;
    try {
      const vitals = await deviceDataService.getLatestVitals(selectedDeviceId);
      setLatestVitals(vitals);
    } catch (error) {
      setLatestVitals(null);
      setLastError(parseApiError(error, 'Failed to load latest vitals'));
    }
  }, [isAuthenticated, parseApiError, selectedDeviceId]);

  const refreshRecentAlerts = useCallback(async () => {
    if (!selectedDeviceId || !isAuthenticated) return;
    try {
      const alerts = await deviceDataService.getRecentAlerts({ deviceId: selectedDeviceId, limit: 20 });
      setRecentAlerts(alerts);
    } catch (error) {
      setRecentAlerts([]);
      setLastError(parseApiError(error, 'Failed to load recent alerts'));
    }
  }, [isAuthenticated, parseApiError, selectedDeviceId]);

  const claimDevice = useCallback(async (deviceId: string) => {
    try {
      setLastError(null);
      await healthLogsService.claimDevice(deviceId);
      await refreshDevices();
    } catch (error) {
      const message = parseApiError(error, 'Failed to claim device');
      setLastError(message);
      throw new Error(message);
    }
  }, [parseApiError, refreshDevices]);

  const loadAvailableLogDates = useCallback(async () => {
    if (!isAuthenticated) {
      setAvailableLogDates([]);
      return;
    }

    try {
      setLastError(null);
      setLogsError(null);
      const dates = await healthLogsService.getAvailableDates();
      setAvailableLogDates(dates);
    } catch (error) {
      const message = parseApiError(error, 'Failed to load log dates');
      setLastError(message);
      setLogsError(message);
      setAvailableLogDates([]);
    }
  }, [isAuthenticated, parseApiError]);

  const loadLogsByRange = useCallback(async (startDate: string, endDate: string) => {
    if (!isAuthenticated) {
      setHistoricalLogs([]);
      setLiveLogs([]);
      return;
    }

    try {
      setIsLoadingLogs(true);
      setLogsError(null);
      const logs = await healthLogsService.getLogsByRange(startDate, endDate);
      const normalized = logs.map((item) => toDeviceLog(item));
      const filtered = selectedDeviceId
        ? normalized.filter((item) => (item.device_id || item.deviceId) === selectedDeviceId)
        : normalized;

      const deduped = dedupeLogs(filtered);
      setHistoricalLogs(deduped);
      // REST-only mode: expose latest fetched records in the "Latest Synced Logs" UI section.
      setLiveLogs(deduped.slice(0, 20));
    } catch (error) {
      const message = parseApiError(error, 'Failed to load logs for the selected range');
      setLogsError(message);
      setHistoricalLogs([]);
      setLiveLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [dedupeLogs, isAuthenticated, parseApiError, selectedDeviceId, toDeviceLog]);

  const scanAndConnect = useCallback(async () => {
    if (!isAuthenticated) {
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');
    await refreshDevices();
  }, [isAuthenticated, refreshDevices]);

  const disconnect = () => {
    setConnectionState('disconnected');
    setLiveLogs([]);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionState('disconnected');
      setDevices([]);
      setSelectedDeviceId(null);
      setLatestVitals(null);
      setRecentAlerts([]);
      setAvailableLogDates([]);
      setHistoricalLogs([]);
      setLiveLogs([]);
      return;
    }

    scanAndConnect();
  }, [isAuthenticated, scanAndConnect]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // NOTE: Devices polling is disabled to prevent unnecessary HTTPS calls.
    // refreshDevices will only be called on authentication/mount.
    // const interval = setInterval(() => {
    //   refreshDevices();
    // }, 30000);

    return () => {};
  }, [isAuthenticated, refreshDevices]);

  useEffect(() => {
    if (!isAuthenticated || !selectedDeviceId) {
      setLiveLogs([]);
      setHistoricalLogs([]);
      return;
    }

    refreshLatestVitals();
    refreshRecentAlerts();
    loadAvailableLogDates();

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 1);
    loadLogsByRange(start.toISOString(), end.toISOString());

    // NOTE: The 15-second polling interval was removed in favor of the real-time websocket connection.
    
    return () => {};
  }, [isAuthenticated, selectedDeviceId, connectionState, refreshLatestVitals, refreshRecentAlerts, loadAvailableLogDates, loadLogsByRange]);

  const value = useMemo<RaspberryPiContextType>(
    () => ({
      connectionState,
      devices,
      selectedDeviceId,
      availableLogDates,
      historicalLogs,
      liveLogs,
      isLoadingLogs,
      logsError,
      latestVitals,
      recentAlerts,
      lastError,
      claimDevice,
      loadAvailableLogDates,
      loadLogsByRange,
      scanAndConnect,
      disconnect,
      refreshDevices,
      refreshLatestVitals,
      refreshRecentAlerts,
      setSelectedDeviceId,
    }),
    [
      connectionState,
      devices,
      selectedDeviceId,
      availableLogDates,
      historicalLogs,
      liveLogs,
      isLoadingLogs,
      logsError,
      latestVitals,
      recentAlerts,
      lastError,
      claimDevice,
      loadAvailableLogDates,
      loadLogsByRange,
      scanAndConnect,
      refreshDevices,
      refreshLatestVitals,
      refreshRecentAlerts,
    ]
  );

  return <RaspberryPiContext.Provider value={value}>{children}</RaspberryPiContext.Provider>;
}

export function useRaspberryPi() {
  const context = useContext(RaspberryPiContext);
  if (!context) {
    throw new Error('useRaspberryPi must be used within RaspberryPiProvider');
  }
  return context;
}
