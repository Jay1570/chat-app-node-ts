import type { Response } from "express";
import type { HttpResponse } from "../types/response.js";

export const sendResponse = <T>(
    res: Response,
    payload: HttpResponse<T>,
): Response => {
    return res.status(payload.statusCode).send(payload);
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
