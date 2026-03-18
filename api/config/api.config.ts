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
      GENERATE: '/summary/generate',
      HISTORY: '/summary/history',
    },
    LOGS: {
      DATES: '/logs/dates',
      RANGE: '/logs/range',
    },
    REPORTS: {
      EXPORT: '/reports/export',
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
