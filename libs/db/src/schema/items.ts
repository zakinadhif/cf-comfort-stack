import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const items = sqliteTable("items", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
