import type { NextFunction, Response } from "express";
import {
    sendResponse,
    sendServerError,
    sendUnauthorized,
} from "../utils/resoonseHandler.js";
import { verifyToken } from "../utils/jwtHelpers.js";
import { getUserbyIdWithoutPassword } from "../services/user.service.js";
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
            return sendResponse(res, {
                statusCode: tokenResult.error.code,
                data: undefined,
                message: tokenResult.error.message,
                success: false,
            });
        }
        if (!tokenResult.data.id) {
            return sendUnauthorized(res);
        }

        const userResult = await getUserbyIdWithoutPassword(
            tokenResult.data.id,
        );
        if (!userResult.success) {
            return sendResponse(res, {
                statusCode: userResult.error.code,
                data: undefined,
                message: userResult.error.message,
                success: false,
            });
        }

        req.user = userResult.data;

        return next();
    } catch {
        return sendServerError(res);
    }
};
