import type { HttpStatusCode } from "../config/HttpStatusCodes.js";

export type HttpResponse<T> = {
    statusCode: HttpStatusCode;
    message: string;
    data?: T;
    success: boolean;
    error?: unknown;
};
