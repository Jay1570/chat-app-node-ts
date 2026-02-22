import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: text().notNull(),
    image_url: text(),
    created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp({ withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdateFn(() => new Date()),
});

export const userWithoutPasswordSelect = {
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    imageUrl: usersTable.image_url,
    createdAt: usersTable.created_at,
    updatedAt: usersTable.updated_at,
};

export const userSelect = {
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    imageUrl: usersTable.image_url,
    password: usersTable.password,
    createdAt: usersTable.created_at,
    updatedAt: usersTable.updated_at,
};
