import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export interface SummaryResponse {
    id: string;
    content: string;
    createdAt: string;
    type: 'daily' | 'weekly' | 'custom';
}

export const summaryService = {
    generateSummary: async (type: 'today' | 'previous') => {
        try {
            const response = await apiClient.post<SummaryResponse>(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, { type });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getHistory: async () => {
        try {
            const response = await apiClient.get<SummaryResponse[]>(API_CONFIG.ENDPOINTS.SUMMARY.HISTORY);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
