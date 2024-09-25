import { config } from 'dotenv';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        /** Set to `true` when using HTTPS */
        NODE_ENV: z.enum(['development', 'production']),

        DATABASE_URL: z.string().url(),

        DOMAIN: z.string().min(1),

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
            .pipe(z.preprocess((value: unknown) => value === 'true', z.boolean())),

        INSIDER_JWT_PUBLIC_KEY_PATH: z.string().min(1),
        INSIDER_ADDITIONAL_LABELS: z.string().optional(),
        INSIDER_WS_PORT: z.string()
            .default('5050')
            .transform((value, ctx) => {
                const parsed = Number(value);

                if (Number.isNaN(parsed)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Expected a number',
                    });

                    return z.NEVER;
                }

                if (parsed < 1 || parsed > 65535) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Expected a port number between 1 and 65535',
                    });

                    return z.NEVER;
                }

                return parsed;
            }),
    },

    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
