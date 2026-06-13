/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - Update this with your backend API URL
  BASE_URL: 'https://unlikely-caryn-sotercare-873e6112.koyeb.app', // Production
  REALTIME_URL: 'https://unlikely-caryn-sotercare-873e6112.koyeb.app/realtime',

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
      USAGE: '/summary/usage',
      UPLOAD_PRESCRIPTION: '/summary/upload-prescription',
      QUERY_PRESCRIPTION: '/summary/query-prescription',
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
      ATTEND: (id: string) => `/alerts/${id}/attend`,
      FALSE_ALARM: (id: string) => `/alerts/${id}/false-alarm`,
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
    NOTIFICATIONS: {
      REGISTER_TOKEN: '/notifications/register-token',
      UNREGISTER_TOKEN: '/notifications/unregister-token',
    },
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // You can add environment-specific logic here
  // For example, based on __DEV__ flag or environment variables
  return API_CONFIG.BASE_URL;
};
