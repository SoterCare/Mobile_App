import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardVitals, RecentAlert } from '@/types/raspberryPi.types';
import { API_CONFIG } from '@/api/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseToUnixMs } from '@/utils/timestamp';

const TOKEN_KEY = 'accessToken';
// If no log arrives within this window, device is considered offline
const DEVICE_OFFLINE_TIMEOUT_MS = 10_000;

export function useRealtimeVitals(deviceId?: string, options?: { onNewAlert?: () => void }) {
  const [vitals, setVitals] = useState<DashboardVitals | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDeviceStreaming, setIsDeviceStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Coalesce high-frequency socket vitals into one render per flush window so a
  // burst of packets can't overflow React's update queue ("max update depth").
  const vitalsBufferRef = useRef<DashboardVitals | null>(null);
  const vitalsFlushRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingRef = useRef(false);
  const VITALS_FLUSH_MS = 500;

  useEffect(() => {
    if (!deviceId) return;

    let socketInstance: Socket | null = null;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        socketInstance = io(API_CONFIG.REALTIME_URL, {
          transports: ['polling', 'websocket'],
          auth: {
            token: token || '',
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
          reconnectionDelayMax: 15000,
          timeout: 10000,
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
          setError(null);
          socketInstance?.emit('subscribe', { deviceId });
        });

        const markDeviceOnline = () => {
          // Guard so redundant packets don't enqueue no-op state updates.
          if (!streamingRef.current) {
            streamingRef.current = true;
            setIsDeviceStreaming(true);
          }
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = setTimeout(() => {
            streamingRef.current = false;
            setIsDeviceStreaming(false);
          }, DEVICE_OFFLINE_TIMEOUT_MS);
        };

        // Buffer vitals and commit at most once per flush window.
        const pushVitals = (next: DashboardVitals) => {
          vitalsBufferRef.current = next;
          if (!vitalsFlushRef.current) {
            vitalsFlushRef.current = setTimeout(() => {
              vitalsFlushRef.current = null;
              if (vitalsBufferRef.current) setVitals(vitalsBufferRef.current);
            }, VITALS_FLUSH_MS);
          }
        };

        socketInstance.on('disconnect', () => {
          console.log('[Socket] Disconnected from server');
          setIsConnected(false);
          streamingRef.current = false;
          setIsDeviceStreaming(false);
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
        });

        socketInstance.on('connect_error', (err) => {
          console.warn('[Socket] Connection error:', err.message);
          setError(err.message);
        });

        socketInstance.on('vitals_update', (data: DashboardVitals) => {
          if (!deviceId || data.deviceId === deviceId) {
            pushVitals(data);
          }
        });

        // Server pushes a pre-classified alert (e.g. from the backend alerting engine)
        socketInstance.on('alert.new', (data: any) => {
          if (!data) return;
          const alertDeviceId = data.deviceId || data.device_id || deviceId || 'unknown';
          if (!deviceId || alertDeviceId === deviceId) {
            const alertTimestamp = parseToUnixMs(data.timestamp ?? data.ts);
            setRecentAlerts((prev) => {
              const newAlert: RecentAlert = {
                id: data.id || `ws_${alertDeviceId}_${alertTimestamp}`,
                type: data.type || 'movement',
                title: data.title || 'Alert',
                timestamp: alertTimestamp,
              };
              return [newAlert, ...prev].slice(0, 10);
            });
            // Also kick the REST poll so contextAlerts stays in sync
            options?.onNewAlert?.();
          }
        });

        // Alert resolved by any client (webapp, another mobile session, etc.)
        socketInstance.on('alert.attended', (data: any) => {
          if (!data?.id) return;
          setRecentAlerts((prev) => prev.filter((a) => a.id !== data.id));
        });

        socketInstance.on('alert.dismissed', (data: any) => {
          if (!data?.id) return;
          setRecentAlerts((prev) => prev.filter((a) => a.id !== data.id));
        });

        socketInstance.on('alert.updated', (data: any) => {
          if (!data?.id) return;
          if (data.status === 'attended' || data.status === 'dismissed' || data.status === 'false_alarm') {
            setRecentAlerts((prev) => prev.filter((a) => a.id !== data.id));
          }
        });

        // Backend broadcasts under 'device.logs.ingested'
        socketInstance.on('device.logs.ingested', (data: any) => {
          // Mark device as online/streaming whenever data arrives
          markDeviceOnline();
          if (data && data.logs && data.logs.length > 0) {
            const latestLog = data.logs[0];
            const logDeviceId = data.deviceId || data.device_id || latestLog.device_id || deviceId || 'unknown';

            // If payload has no explicit deviceId, assume it's for the current device
            if (!deviceId || logDeviceId === deviceId) {
              // Normalize to Unix ms regardless of whether the backend sends ISO, Unix-s, or Unix-ms
              const timestampMs = parseToUnixMs(latestLog.timestamp ?? latestLog.ts);

              const tempVal = latestLog.temperature ?? latestLog.temp;
              const ambientTempVal = latestLog.ambient_temp ?? latestLog.ambientTemp;
              const moistureVal = latestLog.moisture;
              const gaitLabelVal = latestLog.gait_label ?? latestLog.gaitLabel;

              const prev = vitalsBufferRef.current;
              pushVitals({
                ...(prev || {}),
                deviceId: logDeviceId,
                timestamp: timestampMs,
                ...(tempVal !== undefined && { temperature: Number(tempVal) }),
                ...(ambientTempVal !== undefined && { roomTemperature: Number(ambientTempVal) }),
                ...(moistureVal !== undefined && { moisture: Number(moistureVal) }),
                ...(gaitLabelVal !== undefined && { gaitAnalysis: String(gaitLabelVal) }),
              } as DashboardVitals);

              // Alert cards come exclusively from the alert.new socket event (real backend IDs).
              // device.logs.ingested is for vitals/analytics only — never generate alerts here.
            }
          }
        });
      } catch (err: any) {
        console.error('Failed to initialize socket:', err);
        setError(err.message);
      }
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      if (vitalsFlushRef.current) clearTimeout(vitalsFlushRef.current);
      vitalsFlushRef.current = null;
      streamingRef.current = false;
    };
  }, [deviceId]);

  const removeAlert = (id: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const reconnect = () => {};

  return { vitals, recentAlerts, isConnected, isDeviceStreaming, error, reconnect, removeAlert };
}
