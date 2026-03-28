import { eq, desc, aliasedTable, and, ne, ilike, or } from "drizzle-orm";
import {
    conversationTable,
    conversationMemberTable,
} from "../../db/schemas/conversations.schema.js";
import { messagesTable } from "../../db/schemas/messages.schema.js";
import { usersTable } from "../../db/schemas/users.schema.js";
import { internalError, validationError } from "../../core/resultHandlers.js";
import {
    ConversationForList,
    ConversationListQueryRow,
    ConversationType,
} from "../../types/Conversation.js";
import { Result } from "../../types/Result.js";
import { DB } from "../../db/db.js";
import { getUserById } from "../users/user.service.js";

const module = "conversation.service";

export const conversationDirectCreateService = async (
    currentUserId: string,
    otherUserId: string,
    conn: DB,
): Promise<Result<{ id: string; type: ConversationType }>> => {
    try {
        if (currentUserId === otherUserId) {
            return validationError(
                "Cannot create a direct conversation with yourself",
            );
        }

        const otherUserResult = await getUserById(otherUserId, conn);
        if (!otherUserResult.success) {
            return otherUserResult;
        }

        const cm1 = aliasedTable(conversationMemberTable, "cm1");
        const cm2 = aliasedTable(conversationMemberTable, "cm2");

        const [existingConversation] = await conn
            .select({
                id: conversationTable.id,
                type: conversationTable.type,
            })
            .from(conversationTable)
            .innerJoin(cm1, eq(conversationTable.id, cm1.conversationId))
            .innerJoin(cm2, eq(conversationTable.id, cm2.conversationId))
            .where(
                and(
                    eq(conversationTable.type, "direct"),
                    eq(cm1.userId, currentUserId),
                    eq(cm2.userId, otherUserId),
                ),
            )
            .limit(1);

        if (existingConversation) {
            return {
                success: true,
                data: existingConversation,
            };
        }

        return await conn.transaction(async (tx) => {
            const [newConversation] = await tx
                .insert(conversationTable)
                .values({
                    type: "direct",
                })
                .returning({
                    id: conversationTable.id,
                    type: conversationTable.type,
                });
            if (!newConversation) {
                return internalError(module, "conversationDirectCreateService");
            }

            await tx.insert(conversationMemberTable).values([
                { conversationId: newConversation.id, userId: currentUserId },
                { conversationId: newConversation.id, userId: otherUserId },
            ]);

            return {
                success: true,
                data: newConversation,
            };
        });
    } catch (err) {
        return internalError(module, "conversationDirectCreateService", err);
    }
};

export const conversationListService = async (
    userId: string,
    search: string | null,
    conn: DB,
): Promise<Result<ConversationForList[]>> => {
    try {
        const searchPattern = `%${search ?? ""}%`;

        const otherMemberTable = aliasedTable(
            conversationMemberTable,
            "other_member",
        );
        const otherUserTable = aliasedTable(usersTable, "other_user");

        // Latest message subquery (conceptual logic for Drizzle)
        const latestMessageSubquery = conn
            .selectDistinctOn([messagesTable.conversationId], {
                conversationId: messagesTable.conversationId,
                id: messagesTable.id,
                content: messagesTable.content,
                senderId: messagesTable.senderId,
                createdAt: messagesTable.createdAt,
            })
            .from(messagesTable)
            .orderBy(
                messagesTable.conversationId,
                desc(messagesTable.createdAt),
            )
            .as("latest_message");

        const query = (await conn
            .select({
                id: conversationTable.id,
                name: conversationTable.name,
                type: conversationTable.type,
                otherUserName: otherUserTable.name,
                lastMessage: latestMessageSubquery.content,
                lastMessageByUserId: latestMessageSubquery.senderId,
                lastMessageAt: latestMessageSubquery.createdAt,
                senderName: usersTable.name,
            })
            .from(conversationTable)
            .innerJoin(
                conversationMemberTable,
                eq(
                    conversationTable.id,
                    conversationMemberTable.conversationId,
                ),
            )
            .leftJoin(
                latestMessageSubquery,
                eq(conversationTable.id, latestMessageSubquery.conversationId),
            )
            .leftJoin(
                usersTable,
                eq(latestMessageSubquery.senderId, usersTable.id),
            )
            .leftJoin(
                otherMemberTable,
                and(
                    eq(conversationTable.id, otherMemberTable.conversationId),
                    ne(otherMemberTable.userId, userId),
                ),
            )
            .leftJoin(
                otherUserTable,
                eq(otherMemberTable.userId, otherUserTable.id),
            )
            .where(
                and(
                    eq(conversationMemberTable.userId, userId),
                    or(
                        ilike(conversationTable.name, searchPattern),
                        ilike(otherUserTable.name, searchPattern),
                    ),
                ),
            )
            .orderBy(
                desc(latestMessageSubquery.createdAt),
            )) as ConversationListQueryRow[];

        const conversations: ConversationForList[] = query.map((row) => ({
            id: row.id,
            name: row.name || row.otherUserName || "Unnamed Conversation",
            type: row.type,
            lastMessage: row.lastMessage || null,
            lastMessageByUserId: row.lastMessageByUserId,
            lastMessageByUser: row.lastMessageByUserId
                ? {
                      id: row.lastMessageByUserId,
                      name: row.senderName || "Unknown User",
                  }
                : null,
            lastMessageAt: row.lastMessageAt?.toISOString() || null,
        }));

        return {
            success: true,
            data: conversations,
        };
    } catch (err) {
        return internalError(module, "conversationListService", err);
    }
};
