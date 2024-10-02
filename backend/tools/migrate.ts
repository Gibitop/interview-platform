import pg from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { config } from 'dotenv';

config();

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});


(async () => {
    const sql = pg(env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: 'drizzle' });
    await sql.end();
})();
