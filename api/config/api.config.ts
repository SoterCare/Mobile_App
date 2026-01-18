/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - Update this with your backend API URL
  BASE_URL: 'http://192.168.1.100:3000',

  // Request timeout (milliseconds)
  TIMEOUT: 10000,

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
    // Add more endpoint groups as needed
    // USER: {
    //   PROFILE: '/user/profile',
    //   UPDATE: '/user/update',
    // },
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // You can add environment-specific logic here
  // For example, based on __DEV__ flag or environment variables
  return API_CONFIG.BASE_URL;
};
