import type { Response } from "express";
import type { HttpResponse } from "../types/response.js";
import type { ErrorResult } from "../types/Result.js";
import { HttpStatusCode } from "../config/HttpStatusCodes.js";

export const sendResponse = <T>(
    res: Response,
    payload: HttpResponse<T>,
): Response => {
    return res.status(payload.statusCode).send({
        ...payload,
        timestamp: Date.now(),
    });
};

export const sendUnauthorized = (res: Response): Response => {
    return sendResponse(res, {
        success: false,
        data: undefined,
        message: "Unauthorized",
        statusCode: 401,
    });
};

export const sendServerError = (res: Response): Response => {
    return sendResponse(res, {
        success: false,
        data: undefined,
        message: "Internal server error",
        statusCode: 500,
    });
};

export const sendError = (res: Response, error: ErrorResult): Response => {
    if (error.error.code === HttpStatusCode.INTERNAL_SERVER_ERROR) {
        return sendServerError(res);
    }

    return sendResponse(res, {
        success: error.success,
        message: error.error.message,
        statusCode: error.error.code,
        error: error.error.error,
    });
};

export const getHttpStatusLine = (error: ErrorResult): string => {
    const body = JSON.stringify({
        success: false,
        message: error.error.message,
        statusCode: error.error.code,
    });

    return (
        `HTTP/1.1 ${error.error.code} ${error.error.message}\r\n` +
        "Content-Type: application/json\r\n" +
        "Connection: close\r\n" +
        `Content-Length: ${Buffer.byteLength(body)}\r\n` +
        "\r\n" +
        body
    );
};
