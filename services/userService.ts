import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { User } from '@/types/auth.types';

export const userService = {
    updateProfile: async (data: Partial<User>) => {
        try {
            const response = await apiClient.put<{ user: User }>(API_CONFIG.ENDPOINTS.USER.UPDATE, data);
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
    }
};
