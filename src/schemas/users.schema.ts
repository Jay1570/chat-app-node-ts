import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    password: text().notNull(),
    image_url: text(),
});
