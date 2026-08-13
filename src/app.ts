import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "@/routes.js";
import { requestLogger } from "@/middlewares/logger.middleware.js";
import {
    sendError,
    sendResponse,
    sendServerError,
} from "@/core/responseHandler.js";
import { AppError } from "@/types/Result.js";
import { requestContextMiddleware } from "@/middlewares/requestContext.middleware.js";
import { logger } from "@/core/logger.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { upgradeWebSocket } from "hono/bun";
import { authenticateWebSocket } from "@/middlewares/authenticate.middleware.js";
import {
    registerConnection,
    unregisterConnection,
} from "@/websocket/registry.js";
import { handlePong, initHeartbeat } from "@/websocket/heartbeat.js";

const app = new Hono();

app.use(cors());

app.use(requestContextMiddleware);
app.use(requestLogger);

app.route("/api", router);

app.use(
    "/ws",
    authenticateWebSocket,
    upgradeWebSocket((c) => {
        return {
            onOpen(_event, ws) {
                const user = c.get("wsUser");
                registerConnection(user!.id, ws);
                initHeartbeat(ws);
            },
            onMessage(event, ws) {
                let data: unknown;
                try {
                    data = JSON.parse(event.data.toString());
                } catch {
                    return;
                }

                if ((data as { type?: string }).type === "pong") {
                    handlePong(ws);
                    return;
                }

                // dispatch to your WsEvents handlers here
            },
            onClose(_event, ws) {
                const user = c.get("wsUser");
                unregisterConnection(user!.id, ws);
            },
        };
    }),
);

app.notFound((c) => {
    return sendResponse(c, {
        success: false,
        message: `Route ${c.req.method} ${c.req.path} not found`,
        statusCode: 404,
        data: undefined,
    });
});

app.onError((err, c) => {
    if (err instanceof AppError) {
        if (err.error.code === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            logger.error("Request finished with errors", err);
        }
        return sendError(c, err);
    }

    logger.error("Request finished with errors", err);
    return sendServerError(c);
});

export default app;
