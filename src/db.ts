import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import env from "./env.js";

const pool = new Pool({
    connectionString: env.DB_URL,
    max: 20,
});

const db = drizzle(pool);

pool.on("error", (err) => console.error("Unexpected DB pool error", err));

export type DB = typeof db;

export default db;
