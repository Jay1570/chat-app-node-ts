import { drizzle } from "drizzle-orm/node-postgres";
import env from "./env.js";

const db = drizzle(env.DB_URL);

export type DB = typeof db;

export default db;
