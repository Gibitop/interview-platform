import { createEnv } from '@t3-oss/env-core';
import { $ } from 'bun';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});

const urlRegex = /^(?:(?<protocol>.*?):\/\/)?(?:(?<username>.*?)(?::(?<password>.*?))?@)?(?:(?<host>.*?))(?::(?<port>.*?))?(?:\/?$|\/(?<database>.*))/
const parsedUrl = urlRegex.exec(env.DATABASE_URL)?.groups ?? {};

if (!parsedUrl.port) {
    console.error('No port found in DATABASE_URL');
    process.exit(1);
}

if (!parsedUrl.username) {
    console.error('No username found in DATABASE_URL');
    process.exit(1);
}

if (!parsedUrl.password) {
    console.error('No password found in DATABASE_URL');
    process.exit(1);
}

await $`docker run -d --name local-postgres-${Date.now()} -p 5432:${parsedUrl.port} -e POSTGRES_USER=${parsedUrl.username} -e POSTGRES_PASSWORD=${parsedUrl.password} -e POSTGRES_DB=${parsedUrl.database} postgres:16.4-alpine3.20`;
