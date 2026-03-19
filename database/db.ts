import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import * as schema from "./schema";

let expoDb: SQLiteDatabase | null = null;
export let db: any = null;

// Helper to initialize tables (Optional if not using migrations)
// Drizzle usually recommends 'drizzle-kit push' for dev, but for simple embedded usage:
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

// We can run raw SQL to ensure table exists for this simple case without complex migrations
export const initDatabase = async () => {
    try {
        expoDb = await openDatabaseAsync("db.db");
        db = drizzle(expoDb, { schema });

        await expoDb.execAsync(`
            CREATE TABLE IF NOT EXISTS nightly_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            );
        `);
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
};

export const insertLog = async (data: any) => {
    if (!expoDb) return;
    try {
        const timestamp = Date.now();
        await expoDb.runAsync(
            `INSERT INTO nightly_logs (data, synced, created_at) VALUES (?, ?, ?)`,
            [JSON.stringify(data), 0, timestamp]
        );
        console.log("Log saved locally");
    } catch (error) {
        console.error("Failed to save log:", error);
    }
};
