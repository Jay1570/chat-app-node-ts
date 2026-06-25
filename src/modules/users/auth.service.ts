import { eq, and } from "drizzle-orm";
import { type DB } from "@/db/db.js";
import {
    refreshTokensTable,
    fcmTokensTable,
} from "@/db/schemas/auth.schema.js";
import type { ResultAsync } from "@/types/Result.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { internalError } from "@/core/resultHandlers.js";

const module = "auth.service";

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type FcmToken = typeof fcmTokensTable.$inferSelect;

export const createOrUpdateRefreshToken = async (
    userId: string,
    deviceId: string,
    token: string,
    expiresAt: Date,
    deviceName: string | undefined,
    os: string | undefined,
    conn: DB,
): ResultAsync<RefreshToken> => {
    try {
        const [existing] = await conn
            .select()
            .from(refreshTokensTable)
            .where(
                and(
                    eq(refreshTokensTable.userId, userId),
                    eq(refreshTokensTable.deviceId, deviceId),
                ),
            )
            .limit(1);

        let resultToken: RefreshToken;

        if (existing) {
            const [updated] = await conn
                .update(refreshTokensTable)
                .set({
                    token,
                    expiresAt,
                    deviceName: deviceName ?? existing.deviceName,
                    os: os ?? existing.os,
                    updatedAt: new Date(),
                })
                .where(eq(refreshTokensTable.id, existing.id))
                .returning();

            if (!updated) {
                return {
                    success: false,
                    error: {
                        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        message: "Failed to update refresh token",
                    },
                };
            }
            resultToken = updated;
        } else {
            const [inserted] = await conn
                .insert(refreshTokensTable)
                .values({
                    userId,
                    deviceId,
                    token,
                    deviceName,
                    os,
                    expiresAt,
                })
                .returning();

            if (!inserted) {
                return {
                    success: false,
                    error: {
                        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        message: "Failed to create refresh token",
                    },
                };
            }
            resultToken = inserted;
        }

        return { success: true, data: resultToken };
    } catch (err) {
        return internalError(module, "createOrUpdateRefreshToken", err);
    }
};

export const getRefreshTokenByToken = async (
    token: string,
    conn: DB,
): ResultAsync<RefreshToken> => {
    try {
        const [session] = await conn
            .select()
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.token, token))
            .limit(1);

        if (!session) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "Invalid refresh token",
                },
            };
        }

        return { success: true, data: session };
    } catch (err) {
        return internalError(module, "getRefreshTokenByToken", err);
    }
};

export const revokeRefreshToken = async (
    userId: string,
    deviceId: string,
    conn: DB,
): ResultAsync<boolean> => {
    try {
        await conn
            .delete(refreshTokensTable)
            .where(
                and(
                    eq(refreshTokensTable.userId, userId),
                    eq(refreshTokensTable.deviceId, deviceId),
                ),
            );
        return { success: true, data: true };
    } catch (err) {
        return internalError(module, "revokeRefreshToken", err);
    }
};

export const storeFcmToken = async (
    userId: string,
    deviceId: string,
    fcmToken: string,
    conn: DB,
): ResultAsync<FcmToken> => {
    try {
        // Find the active refresh token session for this user and device
        const [activeSession] = await conn
            .select()
            .from(refreshTokensTable)
            .where(
                and(
                    eq(refreshTokensTable.userId, userId),
                    eq(refreshTokensTable.deviceId, deviceId),
                ),
            )
            .limit(1);

        if (!activeSession) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "No active session found for this device",
                },
            };
        }

        const [existing] = await conn
            .select()
            .from(fcmTokensTable)
            .where(eq(fcmTokensTable.deviceId, deviceId))
            .limit(1);

        let resultFcm: FcmToken;

        if (existing) {
            const [updated] = await conn
                .update(fcmTokensTable)
                .set({
                    userId,
                    fcmToken,
                    refreshTokenId: activeSession.id,
                    updatedAt: new Date(),
                })
                .where(eq(fcmTokensTable.id, existing.id))
                .returning();

            if (!updated) {
                return {
                    success: false,
                    error: {
                        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        message: "Failed to update FCM token",
                    },
                };
            }
            resultFcm = updated;
        } else {
            const [inserted] = await conn
                .insert(fcmTokensTable)
                .values({
                    userId,
                    fcmToken,
                    deviceId,
                    refreshTokenId: activeSession.id,
                })
                .returning();

            if (!inserted) {
                return {
                    success: false,
                    error: {
                        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        message: "Failed to save FCM token",
                    },
                };
            }
            resultFcm = inserted;
        }

        return { success: true, data: resultFcm };
    } catch (err) {
        return internalError(module, "storeFcmToken", err);
    }
};
