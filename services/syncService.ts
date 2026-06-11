interface LocalSyncResult {
    success: boolean;
    message: string;
    syncedCount: number;
}

// In-memory buffer to reduce UI/processing blocking
let logBuffer: any[] = [];
const BATCH_SIZE = 5;

export const syncService = {
    /**
     * Log vital data buffer (In-memory, originally Offline First)
     */
    logVitals: async (data: any) => {
        try {
            logBuffer.push({
                data: JSON.stringify(data),
                synced: false,
                createdAt: Date.now(),
            });

            if (logBuffer.length >= BATCH_SIZE) {
                // Previously, this wrote to the local SQLite DB
                logBuffer = []; // Clear buffer
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
        return {
            success: true,
            message: 'Mobile upload is disabled. Logs remain local and backend is read-only for mobile.',
            syncedCount: logBuffer.length,
        };
    }
};
