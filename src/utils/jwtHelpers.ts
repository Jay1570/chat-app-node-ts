import env from "@/config/env.js";
import type { ResultAsync } from "@/types/Result.js";
import type { JwtUserPayload } from "@/types/User.js";
import { sign, verify } from "hono/jwt";
import crypto from "crypto";

const ONE_HOUR_SECONDS = 60 * 60;

export const signJWT = async (payload: JwtUserPayload): Promise<string> => {
    return sign(
        {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + ONE_HOUR_SECONDS,
        },
        env.JWT_SECRET,
        "HS256",
    );
};

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(40).toString("hex");
};

export const hashRefreshToken = (refreshToken: string): string => {
    return crypto.hash("sha256", refreshToken);
};

export const verifyToken = async (
    token: string,
): ResultAsync<JwtUserPayload> => {
    try {
        const decoded = (await verify(
            token,
            env.JWT_SECRET,
            "HS256",
        )) as JwtUserPayload;
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
