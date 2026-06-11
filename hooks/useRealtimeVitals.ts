import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardVitals, RecentAlert } from '@/types/raspberryPi.types';
import { API_CONFIG } from '@/api/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseToUnixMs } from '@/utils/timestamp';

const TOKEN_KEY = 'accessToken';
// If no log arrives within this window, device is considered offline
const DEVICE_OFFLINE_TIMEOUT_MS = 10_000;

export function useRealtimeVitals(deviceId?: string) {
  const [vitals, setVitals] = useState<DashboardVitals | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDeviceStreaming, setIsDeviceStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          setIsDeviceStreaming(true);
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = setTimeout(() => {
            setIsDeviceStreaming(false);
          }, DEVICE_OFFLINE_TIMEOUT_MS);
        };

        socketInstance.on('disconnect', () => {
          console.log('[Socket] Disconnected from server');
          setIsConnected(false);
          setIsDeviceStreaming(false);
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
        });

        socketInstance.on('connect_error', (err) => {
          console.warn('[Socket] Connection error:', err.message);
          setError(err.message);
        });

        socketInstance.on('vitals_update', (data: DashboardVitals) => {
          if (!deviceId || data.deviceId === deviceId) {
            setVitals(data);
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
              const fallAlertVal = latestLog.fall_alert ?? latestLog.fallAlert;
              const sosVal = latestLog.sos;

              setVitals((prev) => ({
                ...(prev || {}),
                deviceId: logDeviceId,
                timestamp: timestampMs,
                ...(tempVal !== undefined && { temperature: Number(tempVal) }),
                ...(ambientTempVal !== undefined && { roomTemperature: Number(ambientTempVal) }),
                ...(moistureVal !== undefined && { moisture: Number(moistureVal) }),
                ...(gaitLabelVal !== undefined && { gaitAnalysis: String(gaitLabelVal) }),
              }) as DashboardVitals);

              const newAlerts: RecentAlert[] = [];
              if (fallAlertVal && String(fallAlertVal) !== '0' && String(fallAlertVal) !== 'false') {
                newAlerts.push({
                  id: `fall_${logDeviceId}_${timestampMs}`,
                  deviceId: logDeviceId,
                  type: 'fall',
                  title: 'Fall Detected',
                  timestamp: timestampMs,
                } as RecentAlert);
              }
              if (sosVal && String(sosVal) !== '0' && String(sosVal) !== 'false') {
                newAlerts.push({
                  id: `sos_${logDeviceId}_${timestampMs}`,
                  deviceId: logDeviceId,
                  type: 'help_call',
                  title: 'Help Call',
                  timestamp: timestampMs,
                } as RecentAlert);
              }

              if (moistureVal !== undefined && Number(moistureVal) > 25) {
                newAlerts.push({
                  id: `urine_${logDeviceId}_${timestampMs}`,
                  deviceId: logDeviceId,
                  type: 'urine',
                  title: 'High Moisture Detected',
                  timestamp: timestampMs,
                } as RecentAlert);
              }

              if (newAlerts.length > 0) {
                setRecentAlerts((prev) => {
                  let filteredNew = [...newAlerts];

                  // Anti-spam: suppress repeated moisture alerts within 5 minutes
                  const hasMoistureAlert = filteredNew.some(a => a.type === 'urine');
                  if (hasMoistureAlert) {
                    const lastMoisture = prev.find(a => a.type === 'urine');
                    if (lastMoisture && Date.now() - lastMoisture.timestamp < 5 * 60 * 1000) {
                      filteredNew = filteredNew.filter(a => a.type !== 'urine');
                    }
                  }

                  return [...filteredNew, ...prev].slice(0, 10);
                });
              }
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
    };
  }, [deviceId]);

  const removeAlert = (id: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const reconnect = () => {};

  return { vitals, recentAlerts, isConnected, isDeviceStreaming, error, reconnect, removeAlert };
}
