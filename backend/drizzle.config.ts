import { defineConfig } from 'drizzle-kit'
import { env } from './src/common/env';

export default defineConfig({
    dialect: 'postgresql',
    schema: "./src/db/tables/*",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
