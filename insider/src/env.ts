import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";


config();

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']),
        WORKING_DIRECTORY: z.string().min(1),
        START_ACTIVE_FILE_NAME: z.string().min(1),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
