// worker/fcm.service.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { FidMulticastMessage, getMessaging } from "firebase-admin/messaging";
import db from "@/db/db.js";
import { inArray } from "drizzle-orm";
import { fcmTokensTable } from "@/db/schemas/auth.schema.js";
import env from "@/config/env.js";

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
        .where(inArray(fcmTokensTable.userId, userIds));

    const tokens = devices
        .map((d) => d.fcmToken)
        .filter((t): t is string => t !== null);

    if (tokens.length === 0) return;

    const message: FidMulticastMessage = {
        fids: tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data ?? {},
        webpush: {
            notification: {
                title: payload.title,
                body: payload.body,
                icon: "/icons/icon-192x192.png",
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

    const response = await getMessaging().sendEachForMulticast(message);

    // log failed tokens
    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            console.error(`FCM failed for token ${tokens[idx]}:`, resp.error);
        }
    });
};
