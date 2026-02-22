export type Result<T> = SuccessResult<T> | ErrorResult;

export type SuccessResult<T> = { success: true; data: T };

export type ErrorResult = { success: false; error: ResultError };

export type ResultError = {
    code: number;
    message: string;
    error?: unknown;
};
