import type { NextFunction, Request, Response } from "express";
import {
    loginPayload,
    registerUserPayload,
    refreshPayload,
    fcmTokenPayload,
} from "@/modules/users/users.validator.js";
import { sendResponse } from "@/core/responseHandler.js";
import { getUserByEmail, insertUser } from "@/modules/users/user.service.js";
import { signJWT, generateRefreshToken } from "@/utils/jwtHelpers.js";
import type { User } from "@/types/User.js";
import { comparePasswords } from "@/utils/hashPassword.js";
import type { AuthRequest } from "@/types/AuthRequest.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { ErrorResult } from "@/types/Result.js";
import db from "@/db/db.js";
import { validatePayload } from "@/core/validator.js";
import {
    createOrUpdateRefreshToken,
    getRefreshTokenByToken,
    revokeRefreshToken,
    storeFcmToken,
} from "@/modules/users/auth.service.js";

export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const payload = req.body;

        const result = validatePayload(registerUserPayload, payload);
        if (!result.success) {
            return next(result);
        }

        const userPayload = result.data;

        const userInsertResult = await insertUser(
            {
                email: userPayload.email,
                name: userPayload.name,
                password: userPayload.password,
            },
            db,
        );
        if (!userInsertResult.success) {
            return next(userInsertResult);
        }

        const user = userInsertResult.data;

        const accessToken = signJWT({ id: user.id });
        const refreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const tokenResult = await createOrUpdateRefreshToken(
            user.id,
            userPayload.deviceId,
            refreshToken,
            expiresAt,
            userPayload.deviceName,
            userPayload.os,
            db,
        );
        if (!tokenResult.success) {
            return next(tokenResult);
        }

        return sendResponse(res, {
            success: true,
            statusCode: HttpStatusCode.CREATED,
            message: "User registered successfully",
            data: {
                accessToken,
                refreshToken,
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
        const result = validatePayload(loginPayload, req.body);
        if (!result.success) {
            return next(result);
        }

        const payload = result.data;

        const userResult = await getUserByEmail(payload.email, true, db);
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
            payload.password,
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

        const accessToken = signJWT({ id: safeUser.id });
        const refreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const tokenResult = await createOrUpdateRefreshToken(
            safeUser.id,
            payload.deviceId,
            refreshToken,
            expiresAt,
            payload.deviceName,
            payload.os,
            db,
        );
        if (!tokenResult.success) {
            return next(tokenResult);
        }

        return sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "Login Successful",
            data: {
                accessToken,
                refreshToken,
                user: safeUser,
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const refreshTokens = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = validatePayload(refreshPayload, req.body);
        if (!result.success) {
            return next(result);
        }

        const payload = result.data;

        const tokenResult = await getRefreshTokenByToken(payload.refreshToken, db);
        if (!tokenResult.success) {
            return next(tokenResult);
        }

        const session = tokenResult.data;

        // Check expiration
        if (new Date(session.expiresAt) < new Date()) {
            return next({
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "Refresh token expired",
                },
            } satisfies ErrorResult);
        }

        // Validate device context
        if (session.deviceId !== payload.deviceId) {
            return next({
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "Invalid device context",
                },
            } satisfies ErrorResult);
        }

        const newAccessToken = signJWT({ id: session.userId });
        const newRefreshToken = generateRefreshToken();
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const updateResult = await createOrUpdateRefreshToken(
            session.userId,
            payload.deviceId,
            newRefreshToken,
            newExpiresAt,
            payload.deviceName,
            payload.os,
            db,
        );
        if (!updateResult.success) {
            return next(updateResult);
        }

        return sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "Tokens refreshed successfully",
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const logoutUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId || typeof deviceId !== "string") {
            return next({
                success: false,
                error: {
                    code: HttpStatusCode.BAD_REQUEST,
                    message: "deviceId is required",
                },
            } satisfies ErrorResult);
        }

        const revokeResult = await revokeRefreshToken(req.user!.id, deviceId, db);
        if (!revokeResult.success) {
            return next(revokeResult);
        }

        return sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "Logged out successfully",
        });
    } catch (err) {
        return next(err);
    }
};

export const updateFcmToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = validatePayload(fcmTokenPayload, req.body);
        if (!result.success) {
            return next(result);
        }

        const payload = result.data;

        const storeResult = await storeFcmToken(
            req.user!.id,
            payload.deviceId,
            payload.fcmToken,
            db,
        );
        if (!storeResult.success) {
            return next(storeResult);
        }

        return sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "FCM token updated successfully",
            data: storeResult.data,
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

