import type { NextFunction, Response } from "express";
import {
    sendError,
    sendServerError,
    sendUnauthorized,
} from "../utils/responseHandler.js";
import { verifyToken } from "../utils/jwtHelpers.js";
import { getUserbyId } from "../services/user.service.js";
import type { AuthRequest } from "../types/AuthRequest.js";

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const token = req.headers.authorization;

        if (!token) return sendUnauthorized(res);

        const tokenResult = verifyToken(token);
        if (!tokenResult.success) {
            return sendError(res, tokenResult);
        }
        if (!tokenResult.data.id) {
            return sendUnauthorized(res);
        }

        const userResult = await getUserbyId(tokenResult.data.id);
        if (!userResult.success) {
            if (userResult.error.code === 404) {
                return sendUnauthorized(res);
            }
            return sendError(res, userResult);
        }

        req.user = userResult.data;

        return next();
    } catch (err) {
        console.error(err);
        return sendServerError(res);
    }
};
