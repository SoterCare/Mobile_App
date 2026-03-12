import axios from 'axios';
import { API_CONFIG } from '@/api/config/api.config';
import {
  GatewayResponse,
  PiConnectionState,
  RecordingSession,
} from '@/types/raspberryPi.types';

type Listener = (state: PiConnectionState) => void;
type RecordingListener = (session: RecordingSession) => void;

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: ReturnType<typeof setTimeout>;
};

class RaspberryPiGatewayService {
  private ws: WebSocket | null = null;
  private state: PiConnectionState = 'disconnected';
  private listeners = new Set<Listener>();
  private recordingListeners = new Set<RecordingListener>();
  private pending = new Map<string, PendingRequest>();
  private recordings = new Map<string, RecordingSession[]>();
  private activeHost: string | null = null;

  get connectionState() {
    return this.state;
  }

  get isConnected() {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  get gatewayHost() {
    return this.activeHost;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  subscribeRecordings(listener: RecordingListener) {
    this.recordingListeners.add(listener);
    return () => this.recordingListeners.delete(listener);
  }

  private setState(next: PiConnectionState) {
    this.state = next;
    this.listeners.forEach((l) => l(next));
  }

  private addRecording(session: RecordingSession) {
    const key = session.deviceId || 'unknown';
    const existing = this.recordings.get(key) || [];
    this.recordings.set(key, [session, ...existing].slice(0, 100));
    this.recordingListeners.forEach((l) => l(session));
  }

  getRecordingSessions(deviceId?: string) {
    if (deviceId) return this.recordings.get(deviceId) || [];
    return Array.from(this.recordings.values()).flat();
  }

  async scanAndConnect(): Promise<boolean> {
    if (this.isConnected) return true;
    this.setState('scanning');

    const host = await this.findRaspberryPiHost();
    if (!host) {
      this.setState('disconnected');
      return false;
    }

    this.setState('connecting');
    const connected = await this.connectWebSocket(host);
    this.setState(connected ? 'connected' : 'disconnected');
    return connected;
  }

  disconnect() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.activeHost = null;
    this.rejectAllPending('Gateway disconnected');
    this.setState('disconnected');
  }

  private rejectAllPending(message: string) {
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error(message));
    });
    this.pending.clear();
  }

  private async findRaspberryPiHost(): Promise<string | null> {
    const candidates = API_CONFIG.RASPBERRY_PI.CANDIDATE_HOSTS;

    for (const host of candidates) {
      const ok = await this.pingHost(host);
      if (ok) {
        this.activeHost = host;
        return host;
      }
    }

    return null;
  }

  private async pingHost(host: string): Promise<boolean> {
    try {
      const url = `http://${host}:${API_CONFIG.RASPBERRY_PI.HTTP_PORT}${API_CONFIG.RASPBERRY_PI.HEALTH_PATH}`;
      const response = await axios.get(url, { timeout: API_CONFIG.RASPBERRY_PI.SCAN_TIMEOUT_MS });
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  }

  private connectWebSocket(host: string): Promise<boolean> {
    return new Promise((resolve) => {
      const wsUrl = `ws://${host}:${API_CONFIG.RASPBERRY_PI.WS_PORT}${API_CONFIG.RASPBERRY_PI.WS_PATH}`;
      const socket = new WebSocket(wsUrl);

      const cleanup = () => {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
      };

      const connectTimeout = setTimeout(() => {
        cleanup();
        try {
          socket.close();
        } catch {
          // no-op
        }
        resolve(false);
      }, API_CONFIG.RASPBERRY_PI.CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        clearTimeout(connectTimeout);
        this.ws = socket;
        this.attachSocketHandlers(socket);
        resolve(true);
      };

      socket.onerror = () => {
        clearTimeout(connectTimeout);
        cleanup();
        resolve(false);
      };

      socket.onclose = () => {
        clearTimeout(connectTimeout);
      };
    });
  }

  private attachSocketHandlers(socket: WebSocket) {
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data));

        if (payload?.type === 'response' && payload.requestId) {
          const pending = this.pending.get(payload.requestId);
          if (!pending) return;
          clearTimeout(pending.timeout);
          this.pending.delete(payload.requestId);

          const response: GatewayResponse = payload;
          if (response.error) {
            pending.reject(new Error(response.error));
          } else {
            pending.resolve(response.data);
          }
          return;
        }

        if (payload?.type === 'recording_started') {
          const session: RecordingSession = {
            recordingId:
              payload.recordingId || payload.id || `sotercare_recording_${Date.now()}`,
            deviceId: payload.deviceId,
            createdAt: payload.timestamp || new Date().toISOString(),
          };
          this.addRecording(session);
          return;
        }
      } catch {
        // ignore malformed payloads
      }
    };

    socket.onerror = () => {
      this.disconnect();
    };

    socket.onclose = () => {
      this.disconnect();
    };
  }

  async request<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: { query?: Record<string, any>; body?: any }
  ): Promise<T> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Raspberry Pi gateway is not connected');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const message = {
      type: 'request',
      requestId,
      method,
      endpoint,
      query: options?.query,
      body: options?.body,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('Gateway request timeout'));
      }, API_CONFIG.RASPBERRY_PI.REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timeout });
      this.ws?.send(JSON.stringify(message));
    });
  }
}

export const raspberryPiGatewayService = new RaspberryPiGatewayService();
