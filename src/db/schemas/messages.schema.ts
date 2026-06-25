import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestampsColumns } from "@/db/schemas/commonColumns.schema.js";
import { conversationTable } from "@/db/schemas/conversations.schema.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import { desc } from "drizzle-orm";

export const messagesTable = pgTable(
    "messages",
    {
        id: uuid().defaultRandom().primaryKey(),
        conversationId: uuid()
            .notNull()
            .references(() => conversationTable.id, { onDelete: "cascade" }),
        senderId: uuid()
            .notNull()
            .references(() => usersTable.id, { onDelete: "set null" }),
        content: text().notNull(),
        isEdited: boolean("is_edited").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        ...timestampsColumns,
    },
    (table) => [
        index("messages_conversation_idx").on(
            table.conversationId,
            desc(table.createdAt),
        ),
        index("messages_sender_idx").on(table.senderId),
    ],
);

export const messagesSelect = {
    ...messagesTable
};
