import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config/api.config';

const TOKEN_KEY = 'accessToken';

/**
 * Axios API Client
 * Centralized HTTP client with interceptors
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

import * as Crypto from 'expo-crypto';

/**
 * Request Interceptor
 * - Automatically adds authentication token to requests
 * - Adds Idempotency-Key to mutation requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Add Auth Token
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Idempotency-Key for mutation requests (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['Idempotency-Key'] = Crypto.randomUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('user');
      // Navigation will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default apiClient;
