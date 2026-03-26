import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardVitals, RecentAlert } from '@/types/raspberryPi.types';
import { API_CONFIG } from '@/api/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    let socketInstance: Socket | null = null;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        socketInstance = io(API_CONFIG.REALTIME_URL, {
          transports: ['websocket'],
          auth: {
            token: token || '',
          },
        });

        socketInstance.on('connect', () => {
          console.log('[Socket] Connected to wss://backend.sotercare.com/realtime');
          setIsConnected(true);
          setError(null);
          if (deviceId) {
            console.log(`[Socket] Subscribing to device: ${deviceId}`);
            socketInstance?.emit('subscribe', { deviceId });
          }
        });

        // Catch ALL incoming events to see what the server is actually sending
        socketInstance.onAny((eventName, ...args) => {
          console.log(`[Socket Received Event]: ${eventName}`, JSON.stringify(args, null, 2));
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
          console.error('Socket connection error:', err);
          setError(err.message);
        });

        socketInstance.on('vitals_update', (data: DashboardVitals) => {
          if (!deviceId || data.deviceId === deviceId) {
            setVitals(data);
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
              const rawTimestamp = latestLog.timestamp || (latestLog.ts ? latestLog.ts * 1000 : null);
              const timestampStr = rawTimestamp ? new Date(rawTimestamp).toISOString() : new Date().toISOString();

              const tempVal = latestLog.temperature ?? latestLog.temp;
              const ambientTempVal = latestLog.ambient_temp ?? latestLog.ambientTemp;
              const moistureVal = latestLog.moisture;
              const gaitLabelVal = latestLog.gait_label ?? latestLog.gaitLabel;
              const fallAlertVal = latestLog.fall_alert ?? latestLog.fallAlert;
              const sosVal = latestLog.sos;

              setVitals((prev) => ({
                ...(prev || {}),
                deviceId: logDeviceId,
                timestamp: timestampStr,
                ...(tempVal !== undefined && { temperature: Number(tempVal) }),
                ...(ambientTempVal !== undefined && { roomTemperature: Number(ambientTempVal) }),
                ...(moistureVal !== undefined && { moisture: Number(moistureVal) }),
                ...(gaitLabelVal !== undefined && { gaitAnalysis: String(gaitLabelVal) }),
              }) as DashboardVitals);

              const newAlerts: RecentAlert[] = [];
              if (fallAlertVal && String(fallAlertVal) !== '0' && String(fallAlertVal) !== 'false') {
                newAlerts.push({
                  id: `fall_${logDeviceId}_${rawTimestamp || Date.now()}`,
                  deviceId: logDeviceId,
                  type: 'fall',
                  title: 'Fall Detected',
                  timestamp: new Date().toISOString(),
                } as RecentAlert);
              }
              if (sosVal && String(sosVal) !== '0' && String(sosVal) !== 'false') {
                newAlerts.push({
                  id: `sos_${logDeviceId}_${rawTimestamp || Date.now()}`,
                  deviceId: logDeviceId,
                  type: 'movement',
                  title: 'SOS Emergency',
                  timestamp: new Date().toISOString(),
                } as RecentAlert);
              }

              if (moistureVal !== undefined && Number(moistureVal) > 25) {
                newAlerts.push({
                  id: `urine_${logDeviceId}_${rawTimestamp || Date.now()}`,
                  deviceId: logDeviceId,
                  type: 'urine',
                  title: 'High Moisture Detected',
                  timestamp: new Date().toISOString(),
                } as RecentAlert);
              }

              if (newAlerts.length > 0) {
                setRecentAlerts((prev) => {
                  let filteredNew = [...newAlerts];
                  
                  // Anti-spam: prevent duplicate continuous analogue alerts like moisture
                  const moistureAlert = filteredNew.find(a => a.type === 'urine');
                  if (moistureAlert) {
                      const lastMoisture = prev.find(a => a.type === 'urine');
                      if (lastMoisture) {
                          const timeSinceLast = Date.now() - new Date(lastMoisture.timestamp).getTime();
                          if (timeSinceLast < 5 * 60 * 1000) { // 5 minutes cooldown
                              filteredNew = filteredNew.filter(a => a.type !== 'urine');
                          }
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
