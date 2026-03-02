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

    generateTodaySummary: async () => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, { type: 'today' });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    generatePreviousSummary: async (date: Date) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, {
                type: 'previous',
                date: date.toISOString().split('T')[0],
            });
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
