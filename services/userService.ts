import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { User } from '@/types/auth.types';

export const userService = {
    updateProfile: async (data: Partial<User>) => {
        try {
            // Map frontend 'phone' to backend 'mobileNumber'
            // Map frontend 'userId' to backend 'id'
            const payload = {
                id: data.userId,
                name: data.name,
                email: data.email, // This might be the OLD email if we are updating profile name only
                mobileNumber: data.phone
            };
            const response = await apiClient.post<{ user: User }>(API_CONFIG.ENDPOINTS.USER.UPDATE, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getProfile: async () => {
        try {
            const response = await apiClient.get<{ user: User }>(API_CONFIG.ENDPOINTS.USER.PROFILE);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    initiateEmailUpdate: async (userId: string, newEmail: string) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.USER.EMAIL_INITIATE, { userId, newEmail });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyEmailUpdate: async (userId: string, newEmail: string, otp: string) => {
        try {
            const response = await apiClient.post<{ user: User }>(API_CONFIG.ENDPOINTS.USER.EMAIL_VERIFY, { userId, newEmail, otp });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
