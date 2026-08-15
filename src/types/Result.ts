import type { HttpStatusCode } from "@/config/HttpStatusCodes.js";

export type Result<T> = SuccessResult<T> | ErrorResult;
export type ResultAsync<T> = Promise<Result<T>>;

export type SuccessResult<T> = { success: true; data: T };

export type ErrorResult = { success: false; error: ResultError };

export type ResultError = {
    code: HttpStatusCode;
    message: string;
    error?: unknown;
    module?: string;
    method?: string;
};

export class AppError extends Error implements ErrorResult {
    readonly success: false;
    readonly error: ResultError;

    constructor(error: ErrorResult) {
        super();
        this.success = error.success;
        this.error = error.error;
    }
}
