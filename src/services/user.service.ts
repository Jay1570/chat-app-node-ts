import { eq } from "drizzle-orm";
import db, { type DB } from "../db.js";
import { usersTable } from "../schemas/users.schema.js";
import type { UserWithoutPassword } from "../types/User.js";
import type { ServiceResult } from "../types/ServiceMethod.js";

export const getUserbyIdWithoutPassword = async (
    userId: string,
    conn: DB = db,
): Promise<ServiceResult<UserWithoutPassword>> => {
    try {
        const [user]: UserWithoutPassword[] = await conn
            .select({
                id: usersTable.id,
                email: usersTable.email,
                name: usersTable.name,
                imageUrl: usersTable.image_url,
            })
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
