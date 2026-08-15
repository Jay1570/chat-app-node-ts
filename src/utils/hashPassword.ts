import type { ResultAsync } from "@/types/Result.js";

export const hashPassword = async (password: string): ResultAsync<string> => {
    try {
        const hashed = await Bun.password.hash(password, {
            algorithm: "bcrypt",
            cost: 10,
        });
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
): ResultAsync<boolean> => {
    try {
        const matched = await Bun.password.verify(
            password,
            hashedPassword,
            "bcrypt",
        );
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
