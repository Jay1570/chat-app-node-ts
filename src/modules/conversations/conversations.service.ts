import {
    eq,
    desc,
    aliasedTable,
    and,
    ne,
    ilike,
    or,
    sql,
    count,
    gt,
    lt,
} from "drizzle-orm";
import {
    conversationTable,
    conversationMemberTable,
    conversationRequestTable,
    ConversationMemberInsertRequest,
} from "@/db/schemas/conversations.schema.js";
import { messagesTable } from "@/db/schemas/messages.schema.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import {
    forbiddenError,
    handleError,
    internalError,
    notFoundError,
    validationError,
} from "@/core/resultHandlers.js";
import {
    ConversationForList,
    ConversationListQueryRow,
    ConversationRequest,
    ConversationType,
    DeleteConversationMemberPayload,
    RequestConversationPayload,
    ReviewConversationRequestPayload,
} from "@/types/Conversation.js";
import { ApiError, ResultAsync } from "@/types/Result.js";
import { DB } from "@/db/db.js";
import { getAllUserByIds } from "@/modules/users/user.service.js";
import { mapOneToMany } from "@/utils/dbUtils.js";
import { BasicUser } from "@/types/User.js";

const module = "conversation.service";

export const sendConversationRequestService = async (
    currentUserId: string,
    {
        userIds: otherUserIds,
        conversationType,
        conversationName,
    }: RequestConversationPayload,
    conn: DB,
): ResultAsync<{ id: string; type: ConversationType }> => {
    try {
        const userIds = new Set(otherUserIds);

        if (userIds.has(currentUserId)) {
            return validationError(
                "Cannot create a conversation with yourself",
            );
        }

        const otherUserResult = await getAllUserByIds(otherUserIds, conn);
        if (!otherUserResult.success) return otherUserResult;

        if (otherUserResult.data.length !== otherUserIds.length) {
            return validationError("Some users do not exist");
        }

        if (conversationType === "direct") {
            const otherUserId = otherUserIds[0];
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
                        eq(cm2.userId, otherUserId!),
                    ),
                )
                .limit(1);

            if (existingConversation) {
                return { success: true, data: existingConversation };
            }

            const [existingRequest] = await conn
                .select({ id: conversationRequestTable.id })
                .from(conversationRequestTable)
                .where(
                    or(
                        and(
                            eq(
                                conversationRequestTable.senderId,
                                currentUserId,
                            ),
                            eq(
                                conversationRequestTable.receiverId,
                                otherUserId!,
                            ),
                        ),
                        and(
                            eq(conversationRequestTable.senderId, otherUserId!),
                            eq(
                                conversationRequestTable.receiverId,
                                currentUserId,
                            ),
                        ),
                    ),
                )
                .limit(1);

            if (existingRequest) {
                return validationError("Request already sent");
            }
        }

        return await conn
            .transaction(
                async (
                    tx,
                ): ResultAsync<{ id: string; type: ConversationType }> => {
                    const [newConversation] = await tx
                        .insert(conversationTable)
                        .values({
                            type: conversationType,
                            name: conversationName,
                        })
                        .returning({
                            id: conversationTable.id,
                            type: conversationTable.type,
                            name: conversationTable.name,
                        });

                    if (!newConversation) {
                        throw new ApiError(
                            internalError(
                                module,
                                "sendConversationRequestService",
                            ),
                        );
                    }

                    const memberRequests: ConversationMemberInsertRequest[] =
                        otherUserIds.map((id) => ({
                            conversationId: newConversation.id,
                            userId: id,
                            status: "pending",
                        }));

                    memberRequests.push({
                        conversationId: newConversation.id,
                        userId: currentUserId,
                        status: "active",
                    });

                    await tx
                        .insert(conversationMemberTable)
                        .values(memberRequests);

                    const requests = otherUserIds.map((receiverId) => ({
                        senderId: currentUserId,
                        receiverId,
                        conversationId: newConversation.id,
                    }));

                    await tx.insert(conversationRequestTable).values(requests);

                    return {
                        success: true,
                        data: newConversation,
                    };
                },
            )
            .catch((err) =>
                handleError(module, "sendConversationRequestService", err),
            );
    } catch (err) {
        return internalError(module, "sendConversationRequestService", err);
    }
};

export const reviewConversationRequestService = async (
    userId: string,
    { requestId, status }: ReviewConversationRequestPayload,
    conn: DB,
): ResultAsync<undefined> => {
    try {
        const conversationRequestResult = await getConversationRequest(
            { userId, requestId },
            conn,
        );
        if (!conversationRequestResult.success) {
            return conversationRequestResult;
        }

        const conversationRequest = conversationRequestResult.data;

        return await conn
            .transaction(async (tx): ResultAsync<undefined> => {
                await tx
                    .delete(conversationRequestTable)
                    .where(and(eq(conversationRequestTable.id, requestId)));

                if (status === "approve") {
                    await tx
                        .update(conversationMemberTable)
                        .set({
                            status: "active",
                        })
                        .where(
                            and(
                                eq(
                                    conversationMemberTable.conversationId,
                                    conversationRequest.conversationId,
                                ),
                                eq(conversationMemberTable.userId, userId),
                            ),
                        );

                    await tx
                        .update(conversationTable)
                        .set({
                            status: "active",
                        })
                        .where(
                            eq(
                                conversationTable.id,
                                conversationRequest.conversationId,
                            ),
                        );
                }

                if (status === "reject") {
                    const deleteConversationMemberResult =
                        await deleteConversationMember(
                            {
                                conversationId:
                                    conversationRequest.conversationId,
                                userId: userId,
                            },
                            tx,
                        );
                    if (!deleteConversationMemberResult.success) {
                        throw new ApiError(deleteConversationMemberResult);
                    }

                    const [memberCount] = await tx
                        .select({ count: count() })
                        .from(conversationMemberTable)
                        .where(
                            eq(
                                conversationMemberTable.conversationId,
                                conversationRequest.conversationId,
                            ),
                        );
                    if (memberCount === undefined) {
                        throw new ApiError(
                            internalError(
                                module,
                                "reviewConversationRequestService",
                                "Unexpected value",
                            ),
                        );
                    }

                    if (memberCount.count <= 1) {
                        const deleteConversationResult =
                            await deleteConversation(
                                conversationRequest.conversationId,
                                tx,
                            );
                        if (!deleteConversationResult.success) {
                            throw new ApiError(deleteConversationResult);
                        }
                    }
                }

                return {
                    success: true,
                    data: undefined,
                };
            })
            .catch((err) =>
                handleError(module, "reviewConversationRequestService", err),
            );
    } catch (err) {
        return internalError(module, "reviewConversationRequestService", err);
    }
};

export const getConversationRequest = async (
    { requestId, userId }: { requestId: string; userId?: string },
    conn: DB,
): ResultAsync<ConversationRequest> => {
    try {
        const [conversationRequest] = await conn
            .select()
            .from(conversationRequestTable)
            .where(
                userId
                    ? and(
                          eq(conversationRequestTable.id, requestId),
                          eq(conversationRequestTable.receiverId, userId),
                      )
                    : eq(conversationRequestTable.id, requestId),
            );

        if (!conversationRequest) {
            return notFoundError("Conversation request not found");
        }

        return {
            success: true,
            data: conversationRequest,
        };
    } catch (err) {
        return internalError(module, "getConversationRequest", err);
    }
};

export const deleteConversationMember = async (
    payload: DeleteConversationMemberPayload,
    conn: DB,
): ResultAsync<undefined> => {
    try {
        const whereClause =
            "conversationId" in payload
                ? and(
                      eq(
                          conversationMemberTable.conversationId,
                          payload.conversationId,
                      ),
                      eq(conversationMemberTable.userId, payload.userId),
                  )
                : eq(conversationMemberTable.id, payload.conversationMemberId);

        await conn.delete(conversationMemberTable).where(whereClause);

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return internalError(module, "deleteConversationMember", err);
    }
};

export const deleteConversation = async (
    conversationId: string,
    conn: DB,
): ResultAsync<undefined> => {
    try {
        await conn
            .delete(conversationTable)
            .where(eq(conversationTable.id, conversationId));

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return internalError(module, "deleteConversation", err);
    }
};

export const conversationListService = async (
    userId: string,
    search: string | null,
    cursor: string | null,
    cursorId: string | null,
    limit: number,
    conn: DB,
): ResultAsync<{
    conversations: ConversationForList[];
    nextCursor: string | null;
    nextCursorId: string | null;
}> => {
    try {
        const searchPattern = `%${search ?? ""}%`;

        const otherMemberTable = aliasedTable(
            conversationMemberTable,
            "other_member",
        );
        const otherUserTable = aliasedTable(usersTable, "other_user");

        const latestMessageSubquery = conn
            .select({
                id: messagesTable.id,
                conversationId: messagesTable.conversationId,
                content: messagesTable.content,
                senderId: messagesTable.senderId,
                createdAt: messagesTable.createdAt,
            })
            .from(messagesTable)
            .where(eq(messagesTable.conversationId, conversationTable.id))
            .orderBy(desc(messagesTable.createdAt))
            .limit(1)
            .as("latest_message");

        const unreadCountSubQuery = sql<{ count: number }>`${conn
            .select({ count: count() })
            .from(messagesTable)
            .where(
                and(
                    eq(messagesTable.conversationId, conversationTable.id),
                    gt(
                        messagesTable.createdAt,
                        sql`COALESCE(${conversationMemberTable.lastReadAt}, to_timestamp(0))`,
                    ),
                    ne(messagesTable.senderId, userId),
                ),
            )}`;

        const query = (await conn
            .select({
                id: conversationTable.id,
                name: conversationTable.name,
                type: conversationTable.type,
                otherUserId: otherUserTable.id,
                otherUserName: otherUserTable.name,
                lastMessage: latestMessageSubquery.content,
                lastMessageByUserId: latestMessageSubquery.senderId,
                lastMessageAt: latestMessageSubquery.createdAt,
                senderName: usersTable.name,
                unreadCount: unreadCountSubQuery,
            })
            .from(conversationTable)
            .innerJoin(
                conversationMemberTable,
                eq(
                    conversationTable.id,
                    conversationMemberTable.conversationId,
                ),
            )
            .leftJoinLateral(latestMessageSubquery, sql`true`)
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
                    eq(conversationMemberTable.status, "active"),
                    eq(conversationTable.status, "active"),
                    or(
                        ilike(conversationTable.name, searchPattern),
                        ilike(otherUserTable.name, searchPattern),
                    ),
                    cursor && cursorId
                        ? or(
                              lt(
                                  latestMessageSubquery.createdAt,
                                  new Date(cursor),
                              ),
                              and(
                                  eq(
                                      latestMessageSubquery.createdAt,
                                      new Date(cursor),
                                  ),
                                  lt(conversationTable.id, cursorId),
                              ),
                          )
                        : undefined,
                ),
            )
            .orderBy(
                desc(latestMessageSubquery.createdAt),
                desc(conversationTable.id),
            )
            .limit(limit + 1)) as ConversationListQueryRow[];

        const processedData = mapOneToMany<
            ConversationListQueryRow,
            "id",
            BasicUser,
            "otherUsers",
            ConversationForList
        >({
            rows: query,
            parentKey: "id",
            childrenKey: "otherUsers",
            createParent: (row) => ({
                id: row.id,
                name: row.name || "Unnamed Conversation",
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
                otherUsers: [],
                unreadCount: row.unreadCount || 0,
            }),
            createChild: (row) => {
                if (!row.otherUserId) return null;

                return {
                    id: row.otherUserId,
                    name: row.otherUserName || "Unknown User",
                };
            },
        });

        const finalConversations: ConversationForList[] = processedData.map(
            (conv) => ({
                id: conv.id,
                type: conv.type,
                name:
                    conv.type === "direct"
                        ? conv.otherUsers[0]?.name || "Unnamed Conversation"
                        : conv.name || "Unnamed Group",
                lastMessage: conv.lastMessage,
                lastMessageByUserId: conv.lastMessageByUserId,
                lastMessageByUser: conv.lastMessageByUser,
                lastMessageAt: conv.lastMessageAt,
                otherUsers: conv.otherUsers,
                unreadCount: conv.unreadCount,
            }),
        );

        const hasMore = finalConversations.length > limit;
        const data = hasMore
            ? finalConversations.slice(0, limit)
            : finalConversations;
        const last = data[data.length - 1];

        return {
            success: true,
            data: {
                conversations: data,
                nextCursor: hasMore ? last!.lastMessageAt : null,
                nextCursorId: hasMore ? last!.id : null,
            },
        };
    } catch (err) {
        return internalError(module, "conversationListService", err);
    }
};

export const checkConversationAccess = async (
    userId: string,
    conversationId: string,
    db: DB,
): ResultAsync<{ userIds: string[] }> => {
    try {
        const members = await db
            .select({
                userId: conversationMemberTable.userId,
            })
            .from(conversationMemberTable)
            .where(
                and(
                    eq(conversationMemberTable.conversationId, conversationId),
                    eq(conversationMemberTable.status, "active"),
                ),
            );

        if (!members.some((m) => m.userId === userId)) {
            return forbiddenError("Access denied");
        }

        return {
            success: true,
            data: {
                userIds: members.map((v) => v.userId),
            },
        };
    } catch (err) {
        return internalError(module, "checkConversationAccess", err);
    }
};
