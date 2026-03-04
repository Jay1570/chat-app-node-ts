import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestampsColumns } from "./commonColumns.schema.js";
import { conversationTable } from "./conversations.schema.js";
import { usersTable } from "./users.schema.js";

export const messagesTable = pgTable(
    "messages",
    {
        id: uuid().defaultRandom().primaryKey(),
        conversationId: uuid()
            .notNull()
            .references(() => conversationTable.id, { onDelete: "cascade" }),
        senderId: uuid()
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        content: text().notNull(),
        isEdited: boolean("is_edited").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        ...timestampsColumns,
    },
    (table) => [
        index("messages_conversation_idx").on(table.conversationId),
        index("messages_sender_idx").on(table.senderId),
    ],
);
