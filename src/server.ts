import env from "@/config/env.js";
import { logger } from "@/core/logger.js";
import { websocket } from "hono/bun";
import app from "@/app.js";

const port = env.PORT || 8000;

const server = Bun.serve({
    port,
    fetch: app.fetch,
    websocket: {
        ...websocket,
        sendPings: true,
        idleTimeout: 30,
        close: (_ws, code, reason) => { 
            logger.info(`ws closed for ${code} ${reason}`);
        }
    },
});

logger.info(`Server is running on port ${port}`);

const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
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
