import type { HttpResponse } from "@/types/response.js";
import type { ErrorResult } from "@/types/Result.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { Context } from "hono";

export const sendResponse = <T>(
    c: Context,
    payload: HttpResponse<T>,
): Response => {
    return c.json(
        {
            ...payload,
            timestamp: new Date(Date.now()).toISOString(),
        },
        payload.statusCode,
    );
};

export const sendUnauthorized = (c: Context): Response => {
    return sendResponse(c, {
        success: false,
        data: undefined,
        message: "Unauthorized",
        statusCode: 401,
    });
};

export const sendServerError = (c: Context): Response => {
    return sendResponse(c, {
        success: false,
        data: undefined,
        message: "Internal server error",
        statusCode: 500,
    });
};

export const sendError = (c: Context, error: ErrorResult): Response => {
    if (error.error.code === HttpStatusCode.INTERNAL_SERVER_ERROR) {
        return sendServerError(c);
    }

    return sendResponse(c, {
        success: error.success,
        message: error.error.message,
        statusCode: error.error.code,
        error: error.error.error,
    });
};
