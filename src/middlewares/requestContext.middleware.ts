import crypto from "crypto";
import { requestContext } from "@/core/requestContext.js";
import { MiddlewareHandler } from "hono";

export const requestContextMiddleware: MiddlewareHandler = (c, next) => {
    const requestId = crypto.randomUUID();

    return requestContext.run({ requestId }, () => {
        c.header("x-request-id", requestId);
        return next();
    });
};
