import { drizzle } from "drizzle-orm/node-postgres";
import env from "../config/env.js";
import { logger } from "../core/logger.js";

const db = drizzle(env.DB_URL, {
    logger: {
        logQuery(query, params) {
            logger.debug("db query", {
                query,
                paramCount: params.length,
                params: env.NODE_ENV === "development" ? params : undefined,
            });
        },
    },
});

export type DB = Omit<typeof db, "$client">;

export default db;
