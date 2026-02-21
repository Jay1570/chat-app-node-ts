import env from "../env.js";
import type { ServiceResult } from "../types/ServiceMethod.js";
import type { JwtUserPayload } from "../types/User.js";
import jwt from "jsonwebtoken";

export const signJWT = (payload: JwtUserPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        algorithm: "RS384",
        expiresIn: "2h",
    });
};

export const verifyToken = (token: string): ServiceResult<JwtUserPayload> => {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
        return {
            success: true,
            data: decoded,
        };
    } catch {
        return {
            success: false,
            error: { code: 403, message: "Unauthorized" },
        };
    }
};
