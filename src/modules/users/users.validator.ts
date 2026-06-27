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
    deviceId: z.string().trim().min(1, "deviceId is required"),
    deviceName: z.string().trim().max(255).optional(),
    os: z.string().trim().max(255).optional(),
});

export const loginPayload = z.object({
    email: z.email("Invalid email"),
    password: z
        .string()
        .trim()
        .max(255, "password should be less than 255 characters"),
    deviceId: z.string().trim().min(1, "deviceId is required"),
    deviceName: z.string().trim().max(255).optional(),
    os: z.string().trim().max(255).optional(),
});

export const refreshPayload = z.object({
    refreshToken: z.string().trim().min(1, "refreshToken is required"),
    deviceId: z.string().trim().min(1, "deviceId is required"),
    deviceName: z.string().trim().max(255).optional(),
    os: z.string().trim().max(255).optional(),
});

export const fcmTokenPayload = z.object({
    fcmToken: z.string().trim().min(1, "fcmToken is required"),
    deviceId: z.string().trim().min(1, "deviceId is required"),
});

export const discoverUsersPayload = z.object({
    search: z.string().min(1),
    cursor: z.iso.datetime().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});
