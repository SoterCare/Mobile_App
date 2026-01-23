import axios from 'axios';
import { API_CONFIG } from '@/api/config/api.config';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    sendSignupCode: async (name: string, email: string) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, { name, email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyRegistration: async (email: string, code: string) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_REGISTER, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },

    // Sign In Flow
    sendLoginCode: async (email: string) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyLogin: async (email: string, code: string) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN_VERIFY, { email, otp: String(code) });
            return response.data; // Expected { accessToken, user }
        } catch (error) {
            throw error;
        }
    },
};
