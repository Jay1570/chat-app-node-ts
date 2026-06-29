import {
    NotificationJob,
    NotificationJobType,
} from "@/queue/notificationJobs.type.js";
import { randomUUID } from "crypto";

const QUEUE_KEY = "notification:queue";

export const enqueueNotification = async (
    type: NotificationJobType,
    userIds: string[],
    payload: NotificationJob["payload"],
) => {
    if (userIds.length === 0) return;

    const job: NotificationJob = {
        id: randomUUID(),
        type,
        userIds,
        payload,
        attempts: 0,
    };

    await Bun.redis.lpush(QUEUE_KEY, JSON.stringify(job));
};
