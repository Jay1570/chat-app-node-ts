import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestampsColumns = {
    createdAt: timestamp("created_at", { withTimezone: true })
        .default(sql`now()`)
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .default(sql`now()`)
        .$onUpdateFn(() => sql`now()`)
        .notNull(),
};
