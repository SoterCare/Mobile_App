import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export interface SummaryResponse {
    id: string;
    content: string;
    createdAt: string;
    type: 'daily' | 'weekly' | 'custom';
}

export interface TodaySummaryResponse {
    summary: string;
    from: string;
    to: string;
}

export interface PreviousSummaryResponse {
    summary: string;
    date: string;
}

// Mock summary text for fallback
const MOCK_SUMMARY = `Throughout the day, the user maintained generally stable vital signs, with normal heart rate and temperature ranges.

SPO₂ stayed within healthy levels except for a brief dip in the evening.

The system detected two risky movements, one minor fall, and three urination events.

No major medical emergencies were identified, but a few observations require attention.`;

// Format time for display (e.g., "12.00 AM")
const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}.${displayMinutes}${ampm}`;
};

// Format date for display (e.g., "07/12/2025")
const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const summaryService = {
    generateSummary: async (type: 'today' | 'previous') => {
        try {
            const response = await apiClient.post<SummaryResponse>(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, { type });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    generateTodaySummary: async (): Promise<TodaySummaryResponse> => {
        try {
            const response = await apiClient.post<TodaySummaryResponse>(
                API_CONFIG.ENDPOINTS.SUMMARY.GENERATE,
                { type: 'today' }
            );
            return response.data;
        } catch (error) {
            // Return mock data on error for development
            console.log('Using mock data for today summary');
            return {
                summary: MOCK_SUMMARY,
                from: '12.00 AM',
                to: formatTime(new Date()),
            };
        }
    },

    generatePreviousSummary: async (date: Date): Promise<PreviousSummaryResponse> => {
        try {
            const response = await apiClient.post<PreviousSummaryResponse>(
                API_CONFIG.ENDPOINTS.SUMMARY.GENERATE,
                { 
                    type: 'previous',
                    date: date.toISOString(),
                }
            );
            return response.data;
        } catch (error) {
            // Return mock data on error for development
            console.log('Using mock data for previous summary');
            return {
                summary: MOCK_SUMMARY,
                date: formatDate(date),
            };
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
