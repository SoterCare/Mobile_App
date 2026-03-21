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

const cleanSummaryText = (rawStr: string): string => {
    let extractedText = '';
    
    // Attempt 1: Single quotes format (Python dict style)
    const sqStart = rawStr.indexOf("[{'type': 'text', 'text': '");
    if (sqStart !== -1) {
        const contentStart = sqStart + "[{'type': 'text', 'text': '".length;
        const extrasMarker = "', 'extras': {";
        const sqEnd = rawStr.lastIndexOf(extrasMarker);
        if (sqEnd > contentStart) {
            extractedText = rawStr.substring(contentStart, sqEnd).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\"/g, '"');
        }
    }
    
    // Attempt 2: Double quotes format (JSON style)
    if (!extractedText) {
        const dqStart = rawStr.indexOf('[{"type": "text", "text": "');
        if (dqStart !== -1) {
            const contentStart = dqStart + '[{"type": "text", "text": "'.length;
            const extrasMarker = '", "extras": {';
            const dqEnd = rawStr.lastIndexOf(extrasMarker);
            if (dqEnd > contentStart) {
                extractedText = rawStr.substring(contentStart, dqEnd).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            }
        }
    }
    
    if (extractedText) {
        const startIndex = sqStart !== -1 ? sqStart : rawStr.indexOf('[{"type": "text", "text": "');
        // Get prefix before the array and remove trailing formatting marks like '---'
        const baseContent = rawStr.substring(0, startIndex).replace(/---\s*$/, '').trim();
        return baseContent ? `${baseContent}\n\n${extractedText}` : extractedText;
    }
    
    return rawStr;
};

const normalizeSummaryText = (data: any): string => {
    if (!data) return 'No summary available.';

    let rawText = '';
    if (typeof data === 'string') {
        rawText = data;
    } else if (typeof data?.data?.summary === 'string') {
        rawText = data.data.summary;
    } else if (typeof data?.summary === 'string') {
        rawText = data.summary;
    } else if (typeof data?.result === 'string') {
        rawText = data.result;
    } else if (typeof data?.data?.message === 'string') {
        rawText = data.data.message;
    } else if (typeof data?.message === 'string') {
        rawText = data.message;
    } else {
        return 'No summary available.';
    }

    return cleanSummaryText(rawText);
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
