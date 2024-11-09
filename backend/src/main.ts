import fastify from 'fastify';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastifyCookie from '@fastify/cookie';
import { createContext } from './trpc/context';
import { appRouter, type AppRouter } from './trpc/router';
import './common/env.js';
import { ping } from './common/roomContainers';
import { stopOvertimeRooms } from './jobs/stop-overtime-rooms';
import { existsSync, mkdirSync } from 'fs';
import { env } from './common/env.js';
import { readFile } from 'fs/promises';
import type packageJson from '../package.json';

await ping();

if (!existsSync(env.RECORDINGS_DIR)) {
    mkdirSync(env.RECORDINGS_DIR);
}

const server = fastify({
    maxParamLength: 5000,
});

server.register(fastifyCookie);

server.register(fastifyTRPCPlugin, {
    prefix: '/api/trpc',
    trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error }) {
            // report to error monitoring
            // console.error(`Error in tRPC handler on path '${path}':`, error);
        },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

stopOvertimeRooms.start();

server.get('/', async () => {
    return { hello: 'world' };
});

server.get('/version', async () => {
    const text = await readFile('./package.json', 'utf-8');
    const { version } = JSON.parse(text) as typeof packageJson;
    return { version };
});

try {
    server.listen(
        { port: 3000, host: '0.0.0.0' },
        () => console.log('Server is running on http://0.0.0.0:3000'),
    );
} catch (err) {
    server.log.error(err);
    process.exit(1);
}
