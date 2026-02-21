import type { ServiceError } from "./ServiceErrors.js";

export type ServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: ServiceError };