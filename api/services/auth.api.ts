import apiClient from '../client';
import { API_CONFIG } from '../config/api.config';
import { LoginCredentials, SignupCredentials } from '@/types/auth.types';

/**
 * Authentication API Service
 * Handles all auth-related API calls
 */

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  /**
   * Signup user
   */
  signup: async (credentials: SignupCredentials) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, credentials);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH);
    return response.data;
  },
};
