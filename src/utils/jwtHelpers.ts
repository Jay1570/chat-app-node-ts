import env from "../env.js";
import type { Result } from "../types/Result.js";
import type { JwtUserPayload } from "../types/User.js";
import jwt from "jsonwebtoken";

export const signJWT = (payload: JwtUserPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "2h",
    });
};

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
