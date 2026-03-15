import type { NextFunction, Response } from "express";
import { sendUnauthorized } from "../core/responseHandler.js";
import { verifyToken } from "../utils/jwtHelpers.js";
import { getUserbyId } from "../modules/users/user.service.js";
import type { AuthRequest } from "../types/AuthRequest.js";
import db from "../db/db.js";

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
            return next(tokenResult.error);
        }
        if (!tokenResult.data.id) {
            return sendUnauthorized(res);
        }

        const userResult = await getUserbyId(tokenResult.data.id, db);
        if (!userResult.success) {
            if (userResult.error.code === 404) {
                return sendUnauthorized(res);
            }
            return next(userResult.error);
        }

        req.user = userResult.data;

        return next();
    } catch (err) {
        return next(err);
    }
};
