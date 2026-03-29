import * as z from "zod/v4";

export const registerUserPayload = z.object({
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

export const loginPayload = registerUserPayload.omit({
    name: true,
});
