/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - Update this with your backend API URL
  BASE_URL: __DEV__
    ? 'http://172.20.10.2:3000' // Localhost (Dev) - If logic fails, use: 'https://backend.sotercare.com/'
    : 'https://unlikely-caryn-sotercare-873e6112.koyeb.app', // Production

  // Request timeout (milliseconds)
  TIMEOUT: 1000000,

  RASPBERRY_PI: {
    ENABLED: true,
    CANDIDATE_HOSTS: [
      'raspberrypi.local',
      '192.168.1.100',
      '192.168.0.100',
      '172.20.10.2',
    ],
    HTTP_PORT: 3000,
    WS_PORT: 8080,
    HEALTH_PATH: '/health',
    WS_PATH: '/ws',
    SCAN_TIMEOUT_MS: 1200,
    CONNECT_TIMEOUT_MS: 6000,
    REQUEST_TIMEOUT_MS: 10000,
  },

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      // Social login temporarily disabled for end users
      SOCIAL_LOGIN: '/auth/social-login-disabled',
      LOGIN_VERIFY: '/auth/login-verify',
      REGISTER: '/auth/register',
      VERIFY_REGISTER: '/auth/verify',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update',
      EMAIL_INITIATE: '/user/email/initiate',
      EMAIL_VERIFY: '/user/email/verify',
    },
    SUMMARY: {
      GENERATE: '/summary',
    },
    LOGS: {
      SYNC: '/logs/sync',
      DATES: '/logs/dates',
    },
    SYNC: {
      RASPBERRY_PI: '/sync/raspberry-pi',
    },
    REPORTS: {
      EXPORT: '/reports/export',
    },
    TIMELINE: {
      DISMISSED: '/timeline/dismissed',
      RESTORE: '/timeline/restore',
    },
    DEVICES: {
      LIST: '/devices',
      STATUS: (deviceId: string) => `/devices/${deviceId}/status`,
    },
    DASHBOARD: {
      LATEST_VITALS: '/dashboard/vitals/latest',
    },
    ALERTS: {
      RECENT: '/alerts/recent',
    },
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // You can add environment-specific logic here
  // For example, based on __DEV__ flag or environment variables
  return API_CONFIG.BASE_URL;
};
