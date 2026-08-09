// worker/notification.worker.ts
import { NotificationJob } from "@/queue/notificationJobs.type.js";
import { sendFcmNotification } from "./fcm.service.js";

const QUEUE_KEY = "notification:queue";
const RETRY_DELAY_MS = 5000;
const MAX_ATTEMPTS = 2;

const processJob = async (job: NotificationJob) => {
    console.log(
        `Processing job ${job.id} [${job.type}] attempt ${job.attempts + 1}`,
    );
    await sendFcmNotification(job.userIds, job.payload);
};

const requeueWithDelay = async (job: NotificationJob) => {
    const retryJob: NotificationJob = { ...job, attempts: job.attempts + 1 };
    Bun.sleepSync(RETRY_DELAY_MS);
    await Bun.redis.lpush(QUEUE_KEY, JSON.stringify(retryJob));
};

export const startWorker = async () => {
    console.log("Notification worker started");

    while (true) {
        try {
            const result = await Bun.redis.brpop(QUEUE_KEY, 0); // blocking pop
            if (!result) continue;

            const job: NotificationJob = JSON.parse(result[1]);

            try {
                await processJob(job);
            } catch (err) {
                console.error(`Job ${job.id} failed:`, err);

                if (job.attempts < MAX_ATTEMPTS - 1) {
                    console.log(`Requeueing job ${job.id} for retry`);
                    await requeueWithDelay(job);
                } else {
                    console.error(
                        `Job ${job.id} permanently failed after ${MAX_ATTEMPTS} attempts`,
                    );
                }
            }
        } catch (err) {
            console.error("Worker loop error:", err);
            await Bun.sleep(1000); // prevent tight loop on redis errors
        }
    }
};
