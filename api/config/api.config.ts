/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - Update this with your backend API URL
  BASE_URL: 'https://unlikely-caryn-sotercare-873e6112.koyeb.app', // Production

  // Request timeout (milliseconds)
  TIMEOUT: 1000000,

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGIN_VERIFY: '/auth/login-verify',
      REGISTER: '/auth/register',
      VERIFY_REGISTER: '/auth/verify',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      SOCIAL_LOGIN: '/auth/social-login',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update',
      EMAIL_INITIATE: '/user/email/initiate',
      EMAIL_VERIFY: '/user/email/verify',
    },
    SUMMARY: {
      GENERATE: '/summary',
      HISTORY: '/summary/history',
      UPLOAD_PRESCRIPTION: '/summary/upload_prescription',
      QUERY_PRESCRIPTION: '/summary/query_prescription',
    },
    LOGS: {
      SYNC: '/logs/sync',
      DATES: '/logs/dates',
      RANGE: '/logs/range',
    },
    DEVICES: {
      LIST: '/devices',
      CLAIM: '/devices/claim',
      STATUS: (deviceId: string) => `/devices/${deviceId}/status`,
    },
    DASHBOARD: {
      LATEST_VITALS: '/dashboard/vitals/latest',
    },
    ALERTS: {
      RECENT: '/alerts/recent',
    },
    REPORTS: {
      EXPORT: '/reports/export',
      DEVICES: '/reports/devices',
    },
    TIMELINE: {
      VITALS: '/timeline/vitals',
      EVENTS: '/timeline/events',
      STATS: '/timeline/stats',
      DATE_OPTIONS: '/timeline/date-options',
      DISMISSED: '/timeline/dismissed',
      RESTORE: '/timeline/restore',
      DISMISS: '/timeline/dismiss',
    },
  },

  // Raspberry Pi Gateway Configuration
  RASPBERRY_PI: {
    // Candidate hosts to scan for Raspberry Pi (in order)
    CANDIDATE_HOSTS: [
      'raspberrypi.local',
      '192.168.1.100',
      '192.168.0.100',
      'localhost',
    ],
    // HTTP port for health check ping
    HTTP_PORT: 8080,
    // WebSocket port for bidirectional communication
    WS_PORT: 8080,
    // Health check endpoint for discovery
    HEALTH_PATH: '/health',
    // WebSocket path for device communication
    WS_PATH: '/ws/gateway',
    // Timeout for individual host ping (milliseconds)
    SCAN_TIMEOUT_MS: 5000,
    // Timeout for WebSocket connection attempt (milliseconds)
    CONNECT_TIMEOUT_MS: 10000,
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // You can add environment-specific logic here
  // For example, based on __DEV__ flag or environment variables
  return API_CONFIG.BASE_URL;
};
