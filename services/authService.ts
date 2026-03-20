import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { Platform } from 'react-native';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
    // Sign Up Flow
    sendSignupCode: async (name: string, email: string) => {
        if (Platform.OS === 'web') {
            await delay(800);
            return { success: true, message: "Mock OTP sent" };
        }
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, { name, email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyRegistration: async (email: string, code: string) => {
        if (Platform.OS === 'web') {
            await delay(800);
            return { 
                accessToken: "mock_web_token", 
                user: { id: "web-user-1", email, name: email.split('@')[0] || "Web User" }
            };
        }
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_REGISTER, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },

    // Sign In Flow
    sendLoginCode: async (email: string) => {
        if (Platform.OS === 'web') {
            await delay(800);
            return { success: true, message: "Mock login OTP sent" };
        }
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyLogin: async (email: string, code: string) => {
        if (Platform.OS === 'web') {
            await delay(800);
            return { 
                accessToken: "mock_web_token", 
                user: { id: "web-user-1", email, name: email.split('@')[0] || "Web User" }
            };
        }
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN_VERIFY, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },

    socialLogin: async (providerToken: string, userDetails: any) => {
        if (Platform.OS === 'web') {
            await delay(800);
            return { 
                accessToken: "mock_web_token", 
                user: { id: "social-web", ...userDetails }
            };
        }
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
