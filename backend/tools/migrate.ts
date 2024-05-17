import pg from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../src/common/env';

(async () => {
    const sql = pg(env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: 'drizzle' });
    await sql.end();
})();
