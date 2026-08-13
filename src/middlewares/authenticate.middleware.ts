import { sendUnauthorized } from "@/core/responseHandler.js";
import { verifyToken } from "@/utils/jwtHelpers.js";
import { getUserById } from "@/modules/users/user.service.js";
import db from "@/db/db.js";
import { MiddlewareHandler } from "hono";
import { AppError } from "@/types/Result.js";

export const authenticateToken: MiddlewareHandler = async (c, next) => {
    const token = c.req.header("Authorization");

    if (!token) return sendUnauthorized(c);

    const tokenResult = verifyToken(token);
    if (!tokenResult.success) {
        throw new AppError(tokenResult);
    }
    if (!tokenResult.data.id) {
        return sendUnauthorized(c);
    }

    const userResult = await getUserById(tokenResult.data.id, db);
    if (!userResult.success) {
        if (userResult.error.code === 404) {
            return sendUnauthorized(c);
        }
        throw new AppError(userResult);
    }

    c.set("user", userResult.data);

    return next();
};

export const authenticateWebSocket: MiddlewareHandler = async (c, next) => {
    const token = c.req.query("token");

    if (!token) {
        return sendUnauthorized(c);
    }

    const payload = verifyToken(token);
    if (!payload.success) {
        throw new AppError(payload);
    }

    const userResult = await getUserById(payload.data.id, db);
    if (!userResult.success) {
        if (userResult.error.code === 404) {
            return sendUnauthorized(c);
        }
        throw new AppError(userResult);
    }

    c.set("wsUser", userResult.data);
    return next();
};
