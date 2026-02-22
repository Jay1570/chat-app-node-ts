import type { Request, Response } from "express";
import {
    validateLoginPayload,
    validateRegisterPayload,
} from "../validators/users.validator.js";
import {
    sendError,
    sendResponse,
    sendServerError,
} from "../utils/responseHandler.js";
import { getUserByEmail, insertUser } from "../services/user.service.js";
import { signJWT } from "../utils/jwtHelpers.js";
import type { User } from "../types/User.js";
import { comparePasswords } from "../utils/hashPassword.js";
import type { AuthRequest } from "../types/AuthRequest.js";
import { HttpStatusCode } from "../config/HttpStatusCodes.js";

export const registerUser = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        const result = validateRegisterPayload(payload);
        if (!result.success) {
            return sendError(res, result);
        }

        const userPayload = result.data;

        const userInsertResult = await insertUser(userPayload);
        if (!userInsertResult.success) {
            return sendError(res, userInsertResult);
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
        console.error(err);
        return sendServerError(res);
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        const result = validateLoginPayload(payload);
        if (!result.success) {
            return sendError(res, result);
        }

        const loginPayload = result.data;

        const userResult = await getUserByEmail(loginPayload.email, true);
        if (!userResult.success) {
            return sendError(res, {
                success: false,
                error: {
                    code: HttpStatusCode.BAD_REQUEST,
                    message: "Invalid email or password",
                },
            });
        }

        const { password: hashedPassword, ...safeUser } =
            userResult.data as User;

        const matchedResult = await comparePasswords(
            loginPayload.password,
            hashedPassword,
        );
        if (!matchedResult.success) {
            return sendError(res, matchedResult);
        }
        if (!matchedResult.data) {
            return sendError(res, {
                success: false,
                error: {
                    code: 400,
                    message: "Invalid email or password",
                },
            });
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
        console.error(err);
        return sendServerError(res);
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
