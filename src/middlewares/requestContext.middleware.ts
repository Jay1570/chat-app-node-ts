import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { requestContext } from "../core/requestContext.js";

export const requestContextMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const requestId = crypto.randomUUID();

    requestContext.run({ requestId }, () => {
        res.setHeader("x-request-id", requestId);
        return next();
    });
};
