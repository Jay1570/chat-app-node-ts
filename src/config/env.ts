import dotenv from "dotenv";

dotenv.config();

if (!process.env.DB_URL) {
    throw new Error("DB_URL is not defined");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const env = {
    NODE_ENV: process.env.NODE_ENV,
    LOG_TO_FILE: process.env.LOG_TO_FILE,
    DB_URL: process.env.DB_URL,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
} as const;

export default env;
