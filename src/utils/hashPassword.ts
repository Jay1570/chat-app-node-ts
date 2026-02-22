import type { Result } from "../types/Result.js";
import bcrypt from "bcrypt";

export const hashPassword = async (
    password: string,
): Promise<Result<string>> => {
    try {
        const hashed = await bcrypt.hash(password, 10);
        return {
            success: true,
            data: hashed,
        };
    } catch (err) {
        return {
            success: false,
            error: {
                code: 500,
                message: "Internal server error",
                error: err,
            },
        };
    }
};

export const comparePasswords = async (
    password: string,
    hashedPassword: string,
): Promise<Result<boolean>> => {
    try {
        const matched = await bcrypt.compare(password, hashedPassword);
        return {
            success: true,
            data: matched,
        };
    } catch (err) {
        return {
            success: false,
            error: {
                code: 500,
                message: "Internal server error",
                error: err,
            },
        };
    }
};
