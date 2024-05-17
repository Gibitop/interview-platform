import { config } from 'dotenv';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),

        /** Path to the docker socket file */
        DOCKER_SOCKET_PATH: z.string().min(1),

        /**
         * Secret (pepper) value used for password hashing.
         * Should be a 32 byte (64 character) hex string.
         * Generate a new one with `openssl rand -hex 32`.
         */
        HASHING_SECRET_HEX: z.string().regex(/[0-9a-f]{64}/),

        REGISTRATION_OPEN: z
            .string()
            .regex(/^(true|false)$/)
            .pipe(z.preprocess(value => value === 'true', z.boolean())),
    },

    /**
     * What object holds the environment variables at runtime. This is usually
     * `process.env` or `import.meta.env`.
     */
    runtimeEnv: process.env,

    /**
     * By default, this library will feed the environment variables directly to
     * the Zod validator.
     *
     * This means that if you have an empty string for a value that is supposed
     * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
     * it as a type mismatch violation. Additionally, if you have an empty string
     * for a value that is supposed to be a string with a default value (e.g.
     * `DOMAIN=` in an ".env" file), the default value will never be applied.
     *
     * In order to solve these issues, we recommend that all new projects
     * explicitly specify this option as true.
     */
    emptyStringAsUndefined: true,
});
