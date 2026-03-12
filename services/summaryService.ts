import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SummaryResponse {
    id: string;
    content: string;
    createdAt: string;
    type: 'daily' | 'weekly' | 'custom';
}

const SUMMARY_HISTORY_KEY = '@summary_history';

const normalizeSummaryText = (data: any): string => {
    if (typeof data === 'string') return data;
    if (typeof data?.summary === 'string') return data.summary;
    if (typeof data?.result === 'string') return data.result;
    if (typeof data?.message === 'string') return data.message;
    return 'No summary available.';
};

const readHistory = async (): Promise<SummaryResponse[]> => {
    try {
        const raw = await AsyncStorage.getItem(SUMMARY_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeHistory = async (history: SummaryResponse[]): Promise<void> => {
    await AsyncStorage.setItem(SUMMARY_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
};

const appendHistory = async (entry: SummaryResponse): Promise<void> => {
    const history = await readHistory();
    await writeHistory([entry, ...history]);
};

export const summaryService = {
    generateSummary: async (type: 'today' | 'previous') => {
        try {
            const prompt =
                type === 'today'
                    ? 'Summarize today\'s patient vitals and important alerts in a concise paragraph.'
                    : 'Summarize the selected day\'s patient vitals and important alerts in a concise paragraph.';

            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, { text: prompt });
            const summary = normalizeSummaryText(response.data);

            const item: SummaryResponse = {
                id: `sum_${Date.now()}`,
                content: summary,
                createdAt: new Date().toISOString(),
                type: type === 'today' ? 'daily' : 'custom',
            };

            await appendHistory(item);
            return item;
        } catch (error) {
            throw error;
        }
    },

    generateTodaySummary: async () => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, {
                text: 'Provide a summary for today\'s patient condition using latest vitals and notable events.',
            });

            const summary = normalizeSummaryText(response.data);

            const item: SummaryResponse = {
                id: `sum_${Date.now()}`,
                content: summary,
                createdAt: new Date().toISOString(),
                type: 'daily',
            };
            await appendHistory(item);

            const now = new Date();
            const timeText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return {
                summary,
                from: '12.00 AM',
                to: timeText,
            };
        } catch (error) {
            throw error;
        }
    },

    generatePreviousSummary: async (date: Date) => {
        try {
            const day = date.toISOString().split('T')[0];
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, {
                text: `Provide a summary for patient data on ${day}.`,
            });

            const summary = normalizeSummaryText(response.data);

            const item: SummaryResponse = {
                id: `sum_${Date.now()}`,
                content: summary,
                createdAt: new Date().toISOString(),
                type: 'custom',
            };
            await appendHistory(item);

            return {
                summary,
                date: day,
            };
        } catch (error) {
            throw error;
        }
    },

    getHistory: async () => {
        try {
            return await readHistory();
        } catch (error) {
            throw error;
        }
    }
};
