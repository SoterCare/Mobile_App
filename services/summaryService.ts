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

export const cleanSummaryText = (rawStr: string): string => {
    // Attempt to match both single-quoted and double-quoted text blocks within the array format
    const match = rawStr.match(/\[\s*\{\s*['"]type['"]\s*:\s*['"]text['"]\s*,\s*['"]text['"]\s*:\s*(['"])(.*?)\1(?:\s*,\s*['"]extras['"]|\s*\})/s);
    
    if (match && match[2]) {
        let extractedText = match[2];
        
        // Remove python/json serialization escapes
        extractedText = extractedText
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");
            
        // Extract the prefix before the array if any
        const baseContent = rawStr.substring(0, match.index).replace(/---\s*$/, '').trim();
        return baseContent ? `${baseContent}\n\n${extractedText}` : extractedText;
    }
    
    // Fallback unescape for everything
    return rawStr.replace(/\\n/g, '\n');
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

export interface UsageInfo {
    usedToday: number;
    limitPerDay: number;
}

const extractUsage = (data: any): UsageInfo => ({
    usedToday: typeof data?.usedToday === 'number' ? data.usedToday : 0,
    limitPerDay: typeof data?.limitPerDay === 'number' ? data.limitPerDay : 5,
});

export const summaryService = {
    generateTodaySummary: async () => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, {
                text: 'today',
                date: 'today',
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
                report: response.data?.report ?? null,
                hasCritical: response.data?.hasCritical ?? false,
                cached: response.data?.cached ?? false,
                ...extractUsage(response.data),
            };
        } catch (error) {
            throw error;
        }
    },

    generatePreviousSummary: async (date: Date) => {
        try {
            const day = date.toISOString().split('T')[0];
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUMMARY.GENERATE, {
                text: day,
                date: day,
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
                report: response.data?.report ?? null,
                hasCritical: response.data?.hasCritical ?? false,
                cached: response.data?.cached ?? false,
                ...extractUsage(response.data),
            };
        } catch (error) {
            throw error;
        }
    },

    getUsage: async (): Promise<UsageInfo> => {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.SUMMARY.USAGE);
            return extractUsage(response.data);
        } catch {
            return { usedToday: 0, limitPerDay: 5 };
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
