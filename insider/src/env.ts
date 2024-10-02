import SuperJSON from "./utils/super-json";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";


config();

const zRoomInfo = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    createdAt: z.date(),
});

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']),
        WORKING_DIRECTORY: z.string().min(1),
        START_ACTIVE_FILE_NAME: z.string().min(1),

        ROOM_INFO: z.string().transform(val => zRoomInfo.parse(SuperJSON.parse(val))),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
