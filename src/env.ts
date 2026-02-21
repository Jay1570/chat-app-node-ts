import dotenv from "dotenv";

dotenv.config();

if (!process.env.DB_URL) {
    throw new Error("DB_URL is not defined");
}

const env = {
    DB_URL: process.env.DB_URL,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
} as const;

export default env;
