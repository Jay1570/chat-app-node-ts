declare namespace Bun {
    interface Env {
        DB_URL: string;
        PORT: string;
        JWT_SECRET: string;
        NODE_ENV: string;
        LOG_TO_FILE: string;
        FIREBASE_PRIVATE_KEY: string;
        FIREBASE_CLIENT_EMAIL: string;
        FIREBASE_PROJECT_ID: string;
        VALKEY_URL: string;
    }
}
