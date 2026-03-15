import type { HttpStatusCode } from "../config/HttpStatusCodes.js";

export type Result<T> = SuccessResult<T> | ErrorResult;

export type SuccessResult<T> = { success: true; data: T };

export type ErrorResult = { success: false; error: ResultError };

export type ResultError = {
    code: HttpStatusCode;
    message: string;
    error?: unknown;
    module?: string;
    method?: string;
};
