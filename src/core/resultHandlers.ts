import { HttpStatusCode } from "../config/HttpStatusCodes.js";
import { ApiError, ErrorResult } from "../types/Result.js";

export const internalError = (
    module: string,
    method: string,
    error?: unknown,
): ErrorResult => {
    return {
        success: false,
        error: {
            code: HttpStatusCode.INTERNAL_SERVER_ERROR,
            message: "Internal server error",
            error,
            method,
            module,
        },
    };
};

export const validationError = (err: unknown): ErrorResult => {
    return {
        success: false,
        error: {
            code: HttpStatusCode.BAD_REQUEST,
            message: "Validation Failed",
            error: err,
        },
    };
};

export const notFoundError = (message: string): ErrorResult => {
    return {
        success: false,
        error: {
            code: HttpStatusCode.NOT_FOUND,
            message: message,
        },
    };
};

export const handleError = (
    module: string,
    method: string,
    error?: unknown,
): ErrorResult => {
    if (error instanceof ApiError) {
        return error.error;
    }

    return internalError(module, method, error);
};
