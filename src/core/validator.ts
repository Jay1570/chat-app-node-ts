import * as z from "zod/v4";
import { Result } from "../types/Result.js";
import { validationError } from "./resultHandlers.js";
import { normalizeZodError } from "../utils/formatters.js";

export const validatePayload = <T extends z.ZodSchema>(
    schema: T,
    payload: unknown,
): Result<z.infer<T>> => {
    const result = schema.safeParse(payload);
    if (!result.success) {
        return validationError(normalizeZodError(result.error));
    }

    return {
        success: true,
        data: result.data,
    };
};
