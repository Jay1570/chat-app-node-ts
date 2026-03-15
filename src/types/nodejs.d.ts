declare namespace NodeJS {
    interface ProcessEnv {
        DB_URL: string;
        PORT: string;
        JWT_SECRET: string;
        NODE_ENV: string;
        LOG_TO_FILE: string;
    }
}
