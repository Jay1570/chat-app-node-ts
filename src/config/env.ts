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
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    VALKEY_URL: process.env.VALKEY_URL,
} as const;

export default env;
