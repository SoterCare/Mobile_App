import { db } from '../database/db';
import { nightlyLogs } from '../database/schema';
import { eq } from "drizzle-orm";

interface LocalSyncResult {
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
     * Deprecated upload path.
     * Logs are no longer uploaded from mobile for Raspberry data.
     * Keep local records and return a no-op result for compatibility.
     */
    syncNightlyLogs: async (): Promise<LocalSyncResult> => {
        try {
            const unsyncedLogs = await db.select().from(nightlyLogs).where(eq(nightlyLogs.synced, false));
            return {
                success: true,
                message: 'Mobile upload is disabled. Logs remain local and backend is read-only for mobile.',
                syncedCount: unsyncedLogs.length,
            };
        } catch (error) {
            console.error('Sync failed:', error);
            return {
                success: false,
                message: 'Unable to read local logs',
                syncedCount: 0,
            };
        }
    }
};
