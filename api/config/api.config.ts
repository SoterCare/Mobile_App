/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - Update this with your backend API URL
  BASE_URL: __DEV__
    ? 'http://192.168.144.170:3000' // Localhost (Dev) - If logic fails, use: 'https://backend.sotercare.com/'
    : 'https://unlikely-caryn-sotercare-873e6112.koyeb.app', // Production

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
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update',
      EMAIL_INITIATE: '/user/email/initiate',
      EMAIL_VERIFY: '/user/email/verify',
    },
    SUMMARY: {
      GENERATE: '/summary/generate',
      HISTORY: '/summary/history',
    },
    LOGS: {
      SYNC: '/logs/sync',
      DATES: '/logs/dates',
    },
    REPORTS: {
      EXPORT: '/reports/export',
    },
    TIMELINE: {
      DISMISSED: '/timeline/dismissed',
      RESTORE: '/timeline/restore',
    },
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // You can add environment-specific logic here
  // For example, based on __DEV__ flag or environment variables
  return API_CONFIG.BASE_URL;
};
