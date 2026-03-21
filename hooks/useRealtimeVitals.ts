import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardVitals, RecentAlert } from '@/types/raspberryPi.types';
import { API_CONFIG } from '@/api/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'accessToken';

export function useRealtimeVitals(deviceId?: string) {
  const [vitals, setVitals] = useState<DashboardVitals | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        socketInstance.on('disconnect', () => {
          console.log('[Socket] Disconnected from server');
          setIsConnected(false);
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
                  id: `rt_fall_${Date.now()}`,
                  deviceId: logDeviceId,
                  type: 'fall',
                  title: 'Fall Detected',
                  timestamp: new Date().toISOString(),
                } as RecentAlert);
              }
              if (sosVal && String(sosVal) !== '0' && String(sosVal) !== 'false') {
                newAlerts.push({
                  id: `rt_sos_${Date.now()}`,
                  deviceId: logDeviceId,
                  type: 'movement',
                  title: 'SOS Emergency',
                  timestamp: new Date().toISOString(),
                } as RecentAlert);
              }

              if (newAlerts.length > 0) {
                setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 10));
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

  const reconnect = () => {
    // Relying on component remount or we can just let Socket.IO auto-reconnect
    // If needed, we'll return a function that can toggle state or call socket.connect()
  };

  return { vitals, recentAlerts, isConnected, error, reconnect };
}
