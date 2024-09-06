import pg from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../common/env';

const pgClient = pg(env.DATABASE_URL);

export const db = drizzle(pgClient, { logger: false });
