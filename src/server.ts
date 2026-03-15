import express, { type Request, type Response } from "express";
import type { Application, NextFunction } from "express";
import env from "./config/env.js";
import cors from "cors";
import router from "./routes.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import {
    sendError,
    sendResponse,
    sendServerError,
} from "./core/responseHandler.js";
import { ErrorResult } from "./types/Result.js";
import { HttpStatusCode } from "./config/HttpStatusCodes.js";
import { requestContextMiddleware } from "./middlewares/requestContext.middleware.js";
import { logger } from "./core/logger.js";

const app: Application = express();
const port = env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use(requestContextMiddleware);
app.use(requestLogger);
app.use("/api", router);

app.use((req, res) => {
    return sendResponse(res, {
        success: false,
        message: `Route ${req.path} not found`,
        statusCode: 404,
        data: undefined,
    });
});

app.use(
    (
        err: Error | ErrorResult | object,
        req: Request,
        res: Response,
        _next: NextFunction,
    ) => {
        if (!err) return sendServerError(res);

        if (
            err instanceof Error ||
            ("success" in err &&
                err.error.code === HttpStatusCode.INTERNAL_SERVER_ERROR)
        ) {
            logger.error("Request finished with errors", err);
            return sendServerError(res);
        }

        if ("success" in err) {
            return sendError(res, err);
        }

        logger.error("Request finished with errors", err);
        return sendServerError(res);
    },
);

process.on("unhandledRejection", (reason) =>
    console.error("Unhandled rejection:", reason),
);
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
