import { eq } from "drizzle-orm";
import db, { type DB } from "../db.js";
import {
    userSelect,
    usersTable,
    userWithoutPasswordSelect,
} from "../schemas/users.schema.js";
import type {
    RegisterUserPayload,
    User,
    UserWithoutPassword,
} from "../types/User.js";
import type { Result } from "../types/Result.js";
import { hashPassword } from "../utils/hashPassword.js";

export const getUserbyId = async (
    userId: string,
    conn: DB = db,
): Promise<Result<UserWithoutPassword>> => {
    try {
        const [user]: UserWithoutPassword[] = await conn
            .select(userWithoutPasswordSelect)
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: { code: 404, message: "User not found" },
            };
        }

        return { success: true, data: user };
    } catch (err) {
        return {
            success: false,
            error: { code: 500, message: "Internal server error", error: err },
        };
    }
};

export const getUserByEmail = async (
    email: string,
    fetchPassword: boolean,
    conn: DB = db,
): Promise<Result<UserWithoutPassword | User>> => {
    try {
        const [user]: UserWithoutPassword[] | User[] = await conn
            .select(fetchPassword ? userSelect : userWithoutPasswordSelect)
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: "User not found",
                },
            };
        }

        return {
            success: true,
            data: user,
        };
    } catch (err) {
        return {
            success: false,
            error: { code: 500, message: "Internal server error", error: err },
        };
    }
};

export const insertUser = async (
    { email, name, password }: RegisterUserPayload,
    conn: DB = db,
): Promise<Result<UserWithoutPassword>> => {
    try {
        const userByEmailResult = await getUserByEmail(email, false, conn);
        if (userByEmailResult.success) {
            return {
                success: false,
                error: {
                    code: 409,
                    message: "User with same email already exists",
                },
            };
        }
        if (
            !userByEmailResult.success &&
            userByEmailResult.error.code === 500
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
                error: { code: 500, message: "Internal server error" },
            };
        }

        return { success: true, data: user };
    } catch (err) {
        return {
            success: false,
            error: { code: 500, message: "Internal server error", error: err },
        };
    }
};
