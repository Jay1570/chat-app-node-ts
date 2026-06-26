import { internalError } from "@/core/resultHandlers.js";
import { DB } from "@/db/db.js";
import { messagesTable } from "@/db/schemas/messages.schema.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import { Message, MessageCreatePayload } from "@/types/Message.js";
import { ResultAsync } from "@/types/Result.js";
import { UserWithoutPassword } from "@/types/User.js";
import { and, desc, eq, lt } from "drizzle-orm";

const module = "messages.service";

export const messageCreateService = async (
    user: UserWithoutPassword,
    conversationId: string,
    payload: MessageCreatePayload,
    conn: DB,
): ResultAsync<Message> => {
    try {
        const [message] = await conn
            .insert(messagesTable)
            .values({
                content: payload.content,
                senderId: user.id,
                conversationId: conversationId,
            })
            .returning();
        if (!message) {
            return internalError(module, "createMessageService");
        }

        return {
            success: true,
            data: {
                ...message,
                sender: {
                    id: user.id,
                    name: user.name,
                },
            },
        };
    } catch (err) {
        return internalError(module, "createMessageService", err);
    }
};

export const messageListService = async (
    conn: DB,
    conversationId: string,
    cursor?: string,
    limit: number = 50,
): ResultAsync<Message[]> => {
    try {
        const messageList = await conn
            .select({
                id: messagesTable.id,
                conversationId: messagesTable.conversationId,
                senderId: messagesTable.senderId,
                content: messagesTable.content,
                isEdited: messagesTable.isEdited,
                isDeleted: messagesTable.isDeleted,
                updatedAt: messagesTable.updatedAt,
                createdAt: messagesTable.createdAt,
                sender: {
                    id: usersTable.id,
                    name: usersTable.name,
                },
            })
            .from(messagesTable)
            .where(
                cursor
                    ? and(
                          eq(messagesTable.conversationId, conversationId),
                          lt(messagesTable.createdAt, new Date(cursor)),
                      )
                    : eq(messagesTable.conversationId, conversationId),
            )
            .leftJoin(usersTable, eq(usersTable.id, messagesTable.senderId))
            .orderBy(desc(messagesTable.createdAt))
            .limit(limit);

        return {
            success: true,
            data: messageList,
        };
    } catch (err) {
        return internalError(module, "messageListService", err);
    }
};
