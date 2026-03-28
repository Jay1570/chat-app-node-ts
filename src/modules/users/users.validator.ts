import * as z from "zod";
import type { LoginPayload, RegisterUserPayload } from "../../types/User.js";
import type { Result } from "../../types/Result.js";
import { normalizeZodError } from "../../utils/formatters.js";
import { validationError } from "../../core/resultHandlers.js";

const registerUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "name is required")
        .max(255, "name should be less than 255 characters"),
    email: z.email("Invalid email"),
    password: z
        .string()
        .trim()
        .max(255, "password should be less than 255 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Invalid password",
        ),
});

const loginSchema = registerUserSchema.omit({
    name: true,
});
export const validateRegisterPayload = (
    payload: unknown,
): Result<RegisterUserPayload> => {
    const result = registerUserSchema.safeParse(payload);
    if (!result.success) {
        return validationError(normalizeZodError(result.error));
    }

    return {
        success: true,
        data: result.data,
    };
};

export const validateLoginPayload = (
    payload: unknown,
): Result<LoginPayload> => {
    const result = loginSchema.safeParse(payload);
    if (!result.success) {
        return validationError(normalizeZodError(result.error));
    }

    return {
        success: true,
        data: result.data,
    };
};
