if (!Bun.env.DB_URL) {
    throw new Error("DB_URL is not defined");
}

if (!Bun.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const env = {
    NODE_ENV: Bun.env.NODE_ENV,
    LOG_TO_FILE: Bun.env.LOG_TO_FILE,
    DB_URL: Bun.env.DB_URL,
    PORT: Bun.env.PORT,
    JWT_SECRET: Bun.env.JWT_SECRET,
    FIREBASE_CLIENT_EMAIL: Bun.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: Bun.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_PROJECT_ID: Bun.env.FIREBASE_PROJECT_ID,
    VALKEY_URL: Bun.env.VALKEY_URL,
} as const;

export default env;
