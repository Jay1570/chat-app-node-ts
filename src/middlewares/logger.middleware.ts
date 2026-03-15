import type { Request, Response, NextFunction } from "express";
import { getRequestId } from "../core/requestContext.js";
import { logger } from "../core/logger.js";

const SENSITIVE_PARAMS = ["token", "password", "api_key", "code", "secret"];

const sanitizeQuery = (query: Record<string, unknown>) => {
    const sanitized = { ...query };
    for (const key of Object.keys(sanitized)) {
        if (SENSITIVE_PARAMS.some((p) => key.toLowerCase().includes(p))) {
            sanitized[key] = "[REDACTED]";
        }
    }
    return sanitized;
};

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const start = Date.now();

    res.on("finish", () => {
        const end = Date.now();

        const request = {
            requestId: getRequestId(),
            method: req.method,
            path: req.baseUrl + req.path,
            query: sanitizeQuery(req.query as Record<string, unknown>),
            contentType: req.headers["content-type"],
            ip: req.ip,
            responseStatus: res.statusCode,
            responseMessage: res.statusMessage,
            resContentType: res.getHeaders()["content-type"],
            startTime: start,
            endTime: end,
            duration: `${end - start}ms`,
        };

        logger.info("Request finished", request);
    });

    return next();
};
