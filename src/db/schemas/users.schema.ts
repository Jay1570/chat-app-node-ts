import { pgTable, uuid, varchar, text, unique } from "drizzle-orm/pg-core";
import { timestampsColumns } from "./commonColumns.schema.js";

export const usersTable = pgTable(
    "users",
    {
        id: uuid().defaultRandom().primaryKey(),
        name: varchar({ length: 255 }).notNull(),
        email: varchar({ length: 255 }).notNull(),
        password: text().notNull(),
        imageUrl: text("image_url"),
        ...timestampsColumns,
    },
    (table) => [unique("users_email_unique").on(table.email)],
);

export const userWithoutPasswordSelect = {
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    imageUrl: usersTable.imageUrl,
    createdAt: usersTable.createdAt,
    updatedAt: usersTable.updatedAt,
};
