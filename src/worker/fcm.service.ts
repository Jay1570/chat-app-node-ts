import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import db from "@/db/db.js";
import { and, eq, gt, inArray } from "drizzle-orm";
import {
    fcmTokensTable,
    refreshTokensTable,
} from "@/db/schemas/auth.schema.js";
import env from "@/config/env.js";
import { logger } from "@/core/logger.js";

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

export const sendFcmNotification = async (
    userIds: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
) => {
    const devices = await db
        .select({ fcmToken: fcmTokensTable.fcmToken })
        .from(fcmTokensTable)
        .innerJoin(
            refreshTokensTable,
            eq(refreshTokensTable.deviceId, fcmTokensTable.deviceId),
        )
        .where(
            and(
                inArray(fcmTokensTable.userId, userIds),
                gt(refreshTokensTable.expiresAt, new Date()),
            ),
        );

    const tokens = devices
        .map((d) => d.fcmToken)
        .filter((t): t is string => t !== null);

    if (tokens.length === 0) return;

    const message: MulticastMessage = {
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data ?? {},
        webpush: {
            notification: {
                title: payload.title,
                body: payload.body,
                icon: "/icons/Icon-512.png",
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                },
            },
        },
    };

    const tokensToRemove: string[] = [];

    const response = await getMessaging().sendEachForMulticast(message);

    // log failed tokens
    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            // const errorCode = resp.error?.code;
            if (resp.error?.httpResponse?.status == 404) {
                tokensToRemove.push(tokens[idx]!);
            } else {
                console.error(
                    `FCM failed for token ${tokens[idx]}:`,
                    resp.error,
                );
            }
        } else {
            logger.debug(`FCM finished for token ${tokens[idx]}:`, resp);
        }
    });

    if (tokensToRemove.length > 0) {
        await db
            .delete(fcmTokensTable)
            .where(inArray(fcmTokensTable.fcmToken, tokensToRemove));
    }
};
