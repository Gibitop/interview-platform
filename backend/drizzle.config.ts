import { defineConfig } from 'drizzle-kit'
import { env } from './tools/migrate';

export default defineConfig({
    dialect: 'postgresql',
    out: './drizzle',
    schema: "./src/db/tables/*",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
