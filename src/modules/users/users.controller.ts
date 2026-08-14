import {
    loginPayload,
    registerUserPayload,
    refreshPayload,
    fcmTokenPayload,
    discoverUsersPayload,
} from "@/modules/users/users.validator.js";
import { sendResponse } from "@/core/responseHandler.js";
import {
    discoverUsersService,
    getUserByEmail,
    insertUser,
} from "@/modules/users/user.service.js";
import {
    signJWT,
    generateRefreshToken,
    hashRefreshToken,
} from "@/utils/jwtHelpers.js";
import type { User } from "@/types/User.js";
import { comparePasswords } from "@/utils/hashPassword.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { AppError } from "@/types/Result.js";
import db from "@/db/db.js";
import { validatePayload } from "@/core/validator.js";
import {
    createOrUpdateRefreshToken,
    getRefreshTokenByToken,
    revokeRefreshToken,
    storeFcmToken,
} from "@/modules/users/auth.service.js";
import { MiddlewareHandler } from "hono";

export const registerUser: MiddlewareHandler = async (c) => {
    const payload = await c.req.json();

    const result = validatePayload(registerUserPayload, payload);
    if (!result.success) {
        throw new AppError(result);
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
        throw new AppError(userInsertResult);
    }

    const user = userInsertResult.data;

    const accessToken = await signJWT({ id: user.id });
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
        throw new AppError(tokenResult);
    }

    return sendResponse(c, {
        success: true,
        statusCode: HttpStatusCode.CREATED,
        message: "User registered successfully",
        data: {
            accessToken,
            refreshToken,
            user: user,
        },
    });
};

export const loginUser: MiddlewareHandler = async (c) => {
    const body = await c.req.json();
    const result = validatePayload(loginPayload, body);
    if (!result.success) {
        throw new AppError(result);
    }

    const payload = result.data;

    const userResult = await getUserByEmail(payload.email, true, db);
    if (!userResult.success) {
        throw new AppError({
            success: false,
            error: {
                code: HttpStatusCode.BAD_REQUEST,
                message: "Invalid email or password",
            },
        });
    }

    const { password: hashedPassword, ...safeUser } = userResult.data as User;

    const matchedResult = await comparePasswords(
        payload.password,
        hashedPassword,
    );
    if (!matchedResult.success) {
        throw new AppError(matchedResult);
    }
    if (!matchedResult.data) {
        throw new AppError({
            success: false,
            error: {
                code: HttpStatusCode.BAD_REQUEST,
                message: "Invalid email or password",
            },
        });
    }

    const accessToken = await signJWT({ id: safeUser.id });
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const tokenResult = await createOrUpdateRefreshToken(
        safeUser.id,
        payload.deviceId,
        refreshTokenHash,
        expiresAt,
        payload.deviceName,
        payload.os,
        db,
    );
    if (!tokenResult.success) {
        throw new AppError(tokenResult);
    }

    return sendResponse(c, {
        success: true,
        statusCode: 200,
        message: "Login Successful",
        data: {
            accessToken,
            refreshToken,
            user: safeUser,
        },
    });
};

export const refreshTokens: MiddlewareHandler = async (c) => {
    const body = await c.req.json();
    const result = validatePayload(refreshPayload, body);
    if (!result.success) {
        throw new AppError(result);
    }

    const payload = result.data;
    const tokenHash = hashRefreshToken(payload.refreshToken);

    const tokenResult = await getRefreshTokenByToken(tokenHash, db);
    if (!tokenResult.success) {
        throw new AppError(tokenResult);
    }

    const session = tokenResult.data;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
        throw new AppError({
            success: false,
            error: {
                code: HttpStatusCode.UNAUTHORIZED,
                message: "Refresh token expired",
            },
        });
    }

    // Validate device context
    if (session.deviceId !== payload.deviceId) {
        throw new AppError({
            success: false,
            error: {
                code: HttpStatusCode.UNAUTHORIZED,
                message: "Invalid device context",
            },
        });
    }

    const newAccessToken = await signJWT({ id: session.userId });
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updateResult = await createOrUpdateRefreshToken(
        session.userId,
        payload.deviceId,
        newRefreshTokenHash,
        newExpiresAt,
        payload.deviceName,
        payload.os,
        db,
    );
    if (!updateResult.success) {
        throw new AppError(updateResult);
    }

    return sendResponse(c, {
        success: true,
        statusCode: 200,
        message: "Tokens refreshed successfully",
        data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        },
    });
};

export const logoutUser: MiddlewareHandler = async (c) => {
    const { deviceId } = await c.req.json();
    if (!deviceId || typeof deviceId !== "string") {
        throw new AppError({
            success: false,
            error: {
                code: HttpStatusCode.BAD_REQUEST,
                message: "deviceId is required",
            },
        });
    }

    const user = c.get("user")!;

    const revokeResult = await revokeRefreshToken(user.id, deviceId, db);
    if (!revokeResult.success) {
        throw new AppError(revokeResult);
    }

    return sendResponse(c, {
        success: true,
        statusCode: 200,
        message: "Logged out successfully",
    });
};

export const updateFcmToken: MiddlewareHandler = async (c) => {
    const body = await c.req.json();
    const result = validatePayload(fcmTokenPayload, body);
    if (!result.success) {
        throw new AppError(result);
    }

    const payload = result.data;
    const user = c.get("user")!;

    const storeResult = await storeFcmToken(
        user.id,
        payload.deviceId,
        payload.fcmToken,
        db,
    );
    if (!storeResult.success) {
        throw new AppError(storeResult);
    }

    return sendResponse(c, {
        success: true,
        statusCode: 200,
        message: "FCM token updated successfully",
        data: storeResult.data,
    });
};

export const currentUser: MiddlewareHandler = async (c) => {
    return sendResponse(c, {
        message: "User fetched successfully",
        statusCode: HttpStatusCode.OK,
        success: true,
        data: c.get("user")!,
    });
};

export const discoverUsersController: MiddlewareHandler = async (c) => {
    const queryValidation = validatePayload(
        discoverUsersPayload,
        c.req.query(),
    );
    if (!queryValidation.success) throw new AppError(queryValidation);

    const { search, cursor, limit } = queryValidation.data;
    const user = c.get("user")!;

    const result = await discoverUsersService(
        user.id,
        search,
        cursor,
        limit,
        db,
    );
    if (!result.success) throw new AppError(result);

    return sendResponse(c, {
        success: true,
        message: "Users fetched successfully",
        statusCode: HttpStatusCode.OK,
        data: result.data,
    });
};
