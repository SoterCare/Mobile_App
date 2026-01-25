import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

// Open the database synchronously (Expo SQLite)
const expoDb = openDatabaseSync("db.db");

// Initialize Drizzle
export const db = drizzle(expoDb, { schema });

// Helper to initialize tables (Optional if not using migrations)
// Drizzle usually recommends 'drizzle-kit push' for dev, but for simple embedded usage:
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

// We can run raw SQL to ensure table exists for this simple case without complex migrations
export const initDatabase = async () => {
    try {
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
