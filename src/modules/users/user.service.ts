import {
    aliasedTable,
    and,
    desc,
    eq,
    ilike,
    inArray,
    lt,
    ne,
    notInArray,
    or,
} from "drizzle-orm";
import { type DB } from "@/db/db.js";
import {
    basicUserSelect,
    usersTable,
    userWithoutPasswordSelect,
} from "@/db/schemas/users.schema.js";
import type {
    BasicUser,
    RegisterUserPayload,
    User,
    UserWithoutPassword,
} from "@/types/User.js";
import type { ResultAsync } from "@/types/Result.js";
import { hashPassword } from "@/utils/hashPassword.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { internalError } from "@/core/resultHandlers.js";
import {
    conversationMemberTable,
    conversationRequestTable,
    conversationTable,
} from "@/db/schemas/conversations.schema.js";

const module = "user.service";

export const getUserById = async (
    userId: string,
    conn: DB,
): ResultAsync<UserWithoutPassword> => {
    try {
        const [user]: UserWithoutPassword[] = await conn
            .select(userWithoutPasswordSelect)
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.NOT_FOUND,
                    message: "User not found",
                },
            };
        }

        return { success: true, data: user };
    } catch (err) {
        return internalError(module, "getUserById", err);
    }
};

export const getUserByEmail = async (
    email: string,
    fetchPassword: boolean,
    conn: DB,
): ResultAsync<UserWithoutPassword | User> => {
    try {
        const [user]: UserWithoutPassword[] | User[] = await conn
            .select(fetchPassword ? usersTable : userWithoutPasswordSelect)
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.NOT_FOUND,
                    message: "User not found",
                },
            };
        }

        return {
            success: true,
            data: user,
        };
    } catch (err) {
        return internalError(module, "getUserByEmail", err);
    }
};

export const insertUser = async (
    { email, name, password }: RegisterUserPayload,
    conn: DB,
): ResultAsync<UserWithoutPassword> => {
    try {
        const userByEmailResult = await getUserByEmail(email, false, conn);
        if (userByEmailResult.success) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.CONFLICT,
                    message: "User with same email already exists",
                },
            };
        }
        if (
            !userByEmailResult.success &&
            userByEmailResult.error.code !== HttpStatusCode.NOT_FOUND
        ) {
            return userByEmailResult;
        }

        const hashedPasswordResult = await hashPassword(password);
        if (!hashedPasswordResult.success) {
            return hashedPasswordResult;
        }

        const [user]: UserWithoutPassword[] = await conn
            .insert(usersTable)
            .values({
                email: email,
                name: name,
                password: hashedPasswordResult.data,
            })
            .returning(userWithoutPasswordSelect);

        if (!user) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    message: "Internal server error",
                },
            };
        }

        return { success: true, data: user };
    } catch (err) {
        return internalError(module, "insertUser", err);
    }
};

export const getAllUserByIds = async (
    userIds: string[],
    conn: DB,
): ResultAsync<BasicUser[]> => {
    try {
        const users: BasicUser[] = await conn
            .select(basicUserSelect)
            .from(usersTable)
            .where(inArray(usersTable.id, userIds));

        return { success: true, data: users };
    } catch (err) {
        return internalError(module, "getAllUserByIds", err);
    }
};

export const discoverUsersService = async (
    userId: string,
    search: string,
    cursor: string | undefined,
    limit: number = 20,
    conn: DB,
): ResultAsync<{ users: BasicUser[]; nextCursor: string | null }> => {
    try {
        const searchPattern = `%${search}%`;

        // users already in a direct conversation with current user
        const cm1 = aliasedTable(conversationMemberTable, "cm1");
        const cm2 = aliasedTable(conversationMemberTable, "cm2");

        const existingConversationUsers = conn
            .select({ userId: cm2.userId })
            .from(cm1)
            .innerJoin(cm2, eq(cm1.conversationId, cm2.conversationId))
            .innerJoin(
                conversationTable,
                eq(conversationTable.id, cm1.conversationId),
            )
            .where(
                and(
                    eq(cm1.userId, userId),
                    ne(cm2.userId, userId),
                    eq(conversationTable.type, "direct"),
                    eq(conversationTable.status, "active"),
                ),
            );

        // users with pending request in either direction
        const pendingRequestUsers = conn
            .select({ userId: conversationRequestTable.senderId })
            .from(conversationRequestTable)
            .where(eq(conversationRequestTable.receiverId, userId))
            .union(
                conn
                    .select({ userId: conversationRequestTable.receiverId })
                    .from(conversationRequestTable)
                    .where(eq(conversationRequestTable.senderId, userId)),
            );

        const users = await conn
            .select({
                ...basicUserSelect,
                createdAt: usersTable.createdAt,
            })
            .from(usersTable)
            .where(
                and(
                    ne(usersTable.id, userId),
                    or(
                        ilike(usersTable.name, searchPattern),
                        ilike(usersTable.email, searchPattern),
                    ),
                    notInArray(usersTable.id, existingConversationUsers),
                    notInArray(usersTable.id, pendingRequestUsers),
                    cursor
                        ? lt(usersTable.createdAt, new Date(cursor))
                        : undefined,
                ),
            )
            .orderBy(desc(usersTable.createdAt))
            .limit(limit + 1);

        const hasMore = users.length > limit;
        const data = hasMore ? users.slice(0, limit) : users;

        return {
            success: true,
            data: {
                users: data,
                nextCursor: hasMore
                    ? data[data.length - 1]!.createdAt.toISOString()
                    : null,
            },
        };
    } catch (err) {
        return internalError(module, "discoverUsersService", err);
    }
};
