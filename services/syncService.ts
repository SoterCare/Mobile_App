import { db } from '../database/db';
import { nightlyLogs } from '../database/schema';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { eq } from "drizzle-orm";

interface SyncResponse {
    success: boolean;
    message: string;
    syncedCount: number;
}

// In-memory buffer to reduce DB I/O
let logBuffer: any[] = [];
const BATCH_SIZE = 5; // Write to DB every 5 logs (approx 20 seconds)

export const syncService = {
    /**
     * Log vital data buffer (Offline First - Drizzle)
     */
    logVitals: async (data: any) => {
        try {
            logBuffer.push({
                data: JSON.stringify(data),
                synced: false,
                createdAt: new Date() // Drizzle expects Date object for timestamp mode
            });

            if (logBuffer.length >= BATCH_SIZE) {
                await db.insert(nightlyLogs).values(logBuffer);
                logBuffer = []; // Clear buffer
                // console.log('Vitals batch written to local DB');
            }
        } catch (e) {
            console.error('Failed to log vitals locally', e);
        }
    },

    /**
     * Sync unsynced logs to backend
     */
    syncNightlyLogs: async () => {
        try {
            // Fetch unsynced logs
            const unsyncedLogs = await db.select().from(nightlyLogs).where(eq(nightlyLogs.synced, false));

            if (unsyncedLogs.length === 0) return;

            const payload = unsyncedLogs.map(log => ({
                id: log.id,
                data: JSON.parse(log.data),
                timestamp: log.createdAt
            }));

            // Send to backend
            const response = await apiClient.post<SyncResponse>(API_CONFIG.ENDPOINTS.LOGS.SYNC, { logs: payload });

            if (response.data.success) {
                // Mark as synced locally
                // Optimize: Update all in one go or loop
                for (const log of unsyncedLogs) {
                    await db.update(nightlyLogs)
                        .set({ synced: true })
                        .where(eq(nightlyLogs.id, log.id));
                }
                console.log(`Synced ${response.data.syncedCount} logs successfully.`);
            } else {
                console.warn('Sync failed:', response.data.message);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
};
