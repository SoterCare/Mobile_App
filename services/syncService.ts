import { db } from '../database/db';
import { nightlyLogs } from '../database/schema';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { eq } from "drizzle-orm";
import pako from "pako";

interface SyncResponse {
    success: boolean;
    message: string;
    syncedCount: number;
}

// In-memory buffer to reduce DB I/O
let logBuffer: any[] = [];
const BATCH_SIZE = 5; // Write to DB every 5 logs (approx 20 seconds)
const CHUNK_SIZE = 200; // SQLite bulk update chunk size

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

            const payload = {
                logs: unsyncedLogs.map(log => ({
                    id: log.id,
                    data: JSON.parse(log.data),
                    timestamp: log.createdAt
                }))
            };

            // Compress payload using pako (GZIP)
            const jsonString = JSON.stringify(payload);
            const compressedData = pako.gzip(jsonString);

            // Send to backend
            const response = await apiClient.post<SyncResponse>(
                API_CONFIG.ENDPOINTS.LOGS.SYNC,
                compressedData,
                {
                    headers: {
                        'Content-Type': 'application/json', // Keep as JSON or application/octet-stream? Standard often implies keeping original type + encoding
                        'Content-Encoding': 'gzip'
                    }
                }
            );

            if (response.data.success) {
                // Mark as synced locally in a single transaction with chunking
                await db.transaction(async (tx) => {
                    for (let i = 0; i < unsyncedLogs.length; i += CHUNK_SIZE) {
                        const chunk = unsyncedLogs.slice(i, i + CHUNK_SIZE);
                        for (const log of chunk) {
                            await tx.update(nightlyLogs)
                                .set({ synced: true })
                                .where(eq(nightlyLogs.id, log.id));
                        }
                    }
                });
                console.log(`Synced ${response.data.syncedCount} logs successfully.`);
            } else {
                console.warn('Sync failed:', response.data.message);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
};
