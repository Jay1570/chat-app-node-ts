import env from "@/config/env.js";
import type { Result } from "@/types/Result.js";
import type { JwtUserPayload } from "@/types/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const signJWT = (payload: JwtUserPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(40).toString("hex");
};

export const hashRefreshToken = (refreshToken: string): string => {
    return crypto.hash("sha256", refreshToken)
}

export const verifyToken = (token: string): Result<JwtUserPayload> => {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
        return {
            success: true,
            data: decoded,
        };
    } catch {
        return {
            success: false,
            error: { code: 401, message: "Unauthorized" },
        };
    }
};

