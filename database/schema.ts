import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const nightlyLogs = sqliteTable("nightly_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    data: text("data").notNull(), // Stores the JSON string of vitals
    synced: integer("synced", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
