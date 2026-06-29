import { startWorker } from "./notification.worker.js";

startWorker().catch((err) => {
    console.error("Worker crashed:", err);
    process.exit(1);
});
