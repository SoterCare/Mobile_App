import { db } from '../database/db';
import { nightlyLogs } from '../database/schema';
import apiClient from '@/api/client';
import { eq } from "drizzle-orm";

export const syncService = {
    /**
     * Log vital data locally (Offline First - Drizzle)
     */
    logVitals: async (data: any) => {
        try {
            await db.insert(nightlyLogs).values({
                data: JSON.stringify(data),
            });
            console.log('Vitals writen to local DB');
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
            await apiClient.post('/logs/sync', { logs: payload });

            // Mark as synced locally
            // Optimize: Update all in one go or loop
            for (const log of unsyncedLogs) {
                await db.update(nightlyLogs)
                    .set({ synced: true })
                    .where(eq(nightlyLogs.id, log.id));
            }

            console.log(`Synced ${unsyncedLogs.length} logs successfully.`);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
};
