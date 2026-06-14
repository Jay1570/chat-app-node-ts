import {
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { timestampsColumns } from "@/db/schemas/commonColumns.schema.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import { InferInsertModel } from "drizzle-orm";

export const conversationTypeEnum = pgEnum("conversation_type_enum", [
    "direct",
    "group",
]);

export const conversationStatusEnum = pgEnum("conversation_status_enum", [
    "pending",
    "active",
]);

export const conversationTable = pgTable("conversations", {
    id: uuid().defaultRandom().primaryKey(),
    type: conversationTypeEnum().notNull(),
    name: varchar({ length: 255 }),
    status: conversationStatusEnum().notNull().default("pending"),
    ...timestampsColumns,
});

export const conversationMemberTable = pgTable(
    "conversation_member",
    {
        id: uuid().defaultRandom().primaryKey(),
        conversationId: uuid("conversation_id")
            .notNull()
            .references(() => conversationTable.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        lastReadAt: timestamp("last_read_at", { withTimezone: true }),
        status: conversationStatusEnum().notNull().default("pending"),
        ...timestampsColumns,
    },
    (table) => [
        uniqueIndex("unique_member_per_conversation").on(
            table.conversationId,
            table.userId,
        ),
    ],
);

export const conversationRequestTable = pgTable(
    "conversation_request",
    {
        id: uuid().defaultRandom().primaryKey(),
        senderId: uuid("sender_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        receiverId: uuid("receiver_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        conversationId: uuid()
            .notNull()
            .references(() => conversationTable.id, { onDelete: "cascade" }),
        ...timestampsColumns,
    },
    (table) => [
        uniqueIndex("unique_pending_request").on(
            table.senderId,
            table.receiverId,
            table.conversationId,
        ),
    ],
);

export type ConversationMemberInsertRequest = InferInsertModel<
    typeof conversationMemberTable
>;
