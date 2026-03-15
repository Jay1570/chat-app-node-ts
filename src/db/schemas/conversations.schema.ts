import {
    pgEnum,
    pgTable,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { timestampsColumns } from "./commonColumns.schema.js";
import { usersTable } from "./users.schema.js";
import { messagesTable } from "./messages.schema.js";

export const conversationTypeEnum = pgEnum("conversation_type_enum", [
    "direct",
    "group",
]);

export const conversationTable = pgTable("conversations", {
    id: uuid().defaultRandom().primaryKey(),
    type: conversationTypeEnum().notNull(),
    name: varchar({ length: 255 }),
    ...timestampsColumns,
});

export const conversationMemberTable = pgTable(
    "conversation_member",
    {
        id: uuid().defaultRandom().primaryKey(),
        conversationId: uuid("conversation_id")
            .notNull()
            .references(() => conversationTable.id),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id),
        lastReadMessageId: uuid("last_read_message_id").references(
            () => messagesTable.id,
        ),
        ...timestampsColumns,
    },
    (table) => [
        uniqueIndex("unique_member_per_conversation").on(
            table.conversationId,
            table.userId,
        ),
    ],
);
