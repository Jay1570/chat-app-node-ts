import env from "@/config/env.js";
import { logger } from "@/core/logger.js";
import { websocket } from "hono/bun";
import app from "@/app.js";
import { startHeartbeat, stopHeartbeat } from "@/websocket/heartbeat.js";

const port = env.PORT || 8000;

const server = Bun.serve({
    port,
    fetch: app.fetch,
    websocket,
});

logger.info(`Server is running on port ${port}`);

startHeartbeat();

const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    stopHeartbeat();
    server.stop();
    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception:", err);
    shutdown("uncaughtException");
});
