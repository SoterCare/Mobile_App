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
import { raspberryPiGatewayService } from '@/services/raspberryPiGatewayService';
import { raspberryPiBackendSyncService } from '@/services/raspberryPiBackendSyncService';
import {
  DashboardVitals,
  PiConnectionState,
  PiDevice,
  RecordingSession,
  RecentAlert,
} from '@/types/raspberryPi.types';

interface RaspberryPiContextType {
  connectionState: PiConnectionState;
  gatewayHost: string | null;
  devices: PiDevice[];
  selectedDeviceId: string | null;
  latestVitals: DashboardVitals | null;
  recentAlerts: RecentAlert[];
  recordings: RecordingSession[];
  scanAndConnect: () => Promise<void>;
  disconnect: () => void;
  refreshDevices: () => Promise<void>;
  refreshLatestVitals: () => Promise<void>;
  refreshRecentAlerts: () => Promise<void>;
  setSelectedDeviceId: (deviceId: string) => void;
}

const RaspberryPiContext = createContext<RaspberryPiContextType | undefined>(undefined);

export function RaspberryPiProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<PiConnectionState>('disconnected');
  const [gatewayHost, setGatewayHost] = useState<string | null>(null);
  const [devices, setDevices] = useState<PiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [latestVitals, setLatestVitals] = useState<DashboardVitals | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await deviceDataService.getDevices({ includeStatus: true });
      setDevices(list);

      if (!selectedDeviceId && list.length > 0) {
        setSelectedDeviceId(list[0].id);
      }
    } catch {
      setDevices([]);
    }
  }, [selectedDeviceId]);

  const refreshLatestVitals = useCallback(async () => {
    if (!selectedDeviceId) return;
    try {
      const vitals = await deviceDataService.getLatestVitals(selectedDeviceId);
      setLatestVitals(vitals);
    } catch {
      setLatestVitals(null);
    }
  }, [selectedDeviceId]);

  const refreshRecentAlerts = useCallback(async () => {
    if (!selectedDeviceId) return;
    try {
      const alerts = await deviceDataService.getRecentAlerts({ deviceId: selectedDeviceId, limit: 20 });
      setRecentAlerts(alerts);
    } catch {
      setRecentAlerts([]);
    }
  }, [selectedDeviceId]);

  const scanAndConnect = useCallback(async () => {
    await raspberryPiGatewayService.scanAndConnect();
    setGatewayHost(raspberryPiGatewayService.gatewayHost);
    await refreshDevices();
  }, [refreshDevices]);

  const disconnect = () => {
    raspberryPiGatewayService.disconnect();
    setGatewayHost(null);
  };

  useEffect(() => {
    const unsub = raspberryPiGatewayService.subscribe((state) => {
      setConnectionState(state);
      setGatewayHost(raspberryPiGatewayService.gatewayHost);
    });

    const unsubRecordings = raspberryPiGatewayService.subscribeRecordings((session) => {
      setRecordings((prev) => [session, ...prev].slice(0, 100));
    });

    scanAndConnect();

    return () => {
      unsub();
      unsubRecordings();
    };
  }, [scanAndConnect]);

  useEffect(() => {
    refreshDevices();
  }, [connectionState, refreshDevices]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    refreshLatestVitals();
    refreshRecentAlerts();

    const interval = setInterval(() => {
      refreshLatestVitals();
      refreshRecentAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDeviceId, connectionState, refreshLatestVitals, refreshRecentAlerts]);

  // Scheduled backend sync from Raspberry Pi data: 3 times per day (00/08/16 slots)
  useEffect(() => {
    const runSyncIfDue = async () => {
      try {
        await raspberryPiBackendSyncService.runScheduledSync();
      } catch (error) {
        console.warn('Raspberry Pi scheduled sync failed:', error);
      }
    };

    // Try once on mount/connection changes
    runSyncIfDue();

    // Check every 5 minutes whether current slot is due and not synced yet
    const interval = setInterval(runSyncIfDue, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [connectionState]);

  const value = useMemo<RaspberryPiContextType>(
    () => ({
      connectionState,
      gatewayHost,
      devices,
      selectedDeviceId,
      latestVitals,
      recentAlerts,
      recordings,
      scanAndConnect,
      disconnect,
      refreshDevices,
      refreshLatestVitals,
      refreshRecentAlerts,
      setSelectedDeviceId,
    }),
    [
      connectionState,
      gatewayHost,
      devices,
      selectedDeviceId,
      latestVitals,
      recentAlerts,
      recordings,
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
