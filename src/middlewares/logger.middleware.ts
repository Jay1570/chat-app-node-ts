import { getRequestId } from "@/core/requestContext.js";
import { logger } from "@/core/logger.js";
import { MiddlewareHandler } from "hono";

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

export const requestLogger: MiddlewareHandler = async (c, next) => {
    const start = Date.now();

    await next();

    const end = Date.now();

    const request = {
        requestId: getRequestId(),
        method: c.req.method,
        path: c.req.path,
        query: sanitizeQuery(c.req.query() as Record<string, unknown>),
        contentType: c.req.header("content-type"),
        contentLength: c.req.header("content-length"),
        xForwardedFor: c.req.header("x-forwarded-for"),
        xRealIp: c.req.header("x-real-ip"),
        responseStatus: c.res.status,
        resContentType: c.res.headers.get("content-type"),
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        duration: `${end - start}ms`,
    };

    logger.info("Request finished", request);
};
