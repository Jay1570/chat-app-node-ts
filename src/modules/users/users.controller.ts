import type { NextFunction, Request, Response } from "express";
import {
    validateLoginPayload,
    validateRegisterPayload,
} from "./users.validator.js";
import { sendResponse } from "../../core/responseHandler.js";
import { getUserByEmail, insertUser } from "./user.service.js";
import { signJWT } from "../../utils/jwtHelpers.js";
import type { User } from "../../types/User.js";
import { comparePasswords } from "../../utils/hashPassword.js";
import type { AuthRequest } from "../../types/AuthRequest.js";
import { HttpStatusCode } from "../../config/HttpStatusCodes.js";
import { ErrorResult } from "../../types/Result.js";
import db from "../../db/db.js";

export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const payload = req.body;

        const result = validateRegisterPayload(payload);
        if (!result.success) {
            return next(result);
        }

        const userPayload = result.data;

        const userInsertResult = await insertUser(userPayload, db);
        if (!userInsertResult.success) {
            return next(userInsertResult);
        }

        const user = userInsertResult.data;

        const jwtToken = signJWT({ id: user.id });

        return sendResponse(res, {
            success: true,
            statusCode: HttpStatusCode.CREATED,
            message: "User registered successfully",
            data: {
                token: jwtToken,
                user: user,
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const payload = req.body;

        const result = validateLoginPayload(payload);
        if (!result.success) {
            return next(result);
        }

        const loginPayload = result.data;

        const userResult = await getUserByEmail(loginPayload.email, true, db);
        if (!userResult.success) {
            return next({
                success: false,
                error: {
                    code: HttpStatusCode.BAD_REQUEST,
                    message: "Invalid email or password",
                },
            } satisfies ErrorResult);
        }

        const { password: hashedPassword, ...safeUser } =
            userResult.data as User;

        const matchedResult = await comparePasswords(
            loginPayload.password,
            hashedPassword,
        );
        if (!matchedResult.success) {
            return next(matchedResult);
        }
        if (!matchedResult.data) {
            return next({
                success: false,
                error: {
                    code: HttpStatusCode.BAD_REQUEST,
                    message: "Invalid email or password",
                },
            } satisfies ErrorResult);
        }

        const jwtToken = signJWT({ id: safeUser.id });

        return sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "Login Successful",
            data: {
                token: jwtToken,
                user: safeUser,
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const currentUser = async (req: AuthRequest, res: Response) => {
    return sendResponse(res, {
        message: "User fetched successfully",
        statusCode: HttpStatusCode.OK,
        success: true,
        data: req.user!,
    });
};
