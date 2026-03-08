import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export const authService = {
    // Sign Up Flow
    sendSignupCode: async (name: string, email: string) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, { name, email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyRegistration: async (email: string, code: string) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_REGISTER, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },

    // Sign In Flow
    sendLoginCode: async (email: string) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyLogin: async (email: string, code: string) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN_VERIFY, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },

    socialLogin: async (providerToken: string, userDetails: any) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SOCIAL_LOGIN, {
                providerToken,
                ...userDetails
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};
