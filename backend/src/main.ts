import fastify from 'fastify';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastifyCookie from '@fastify/cookie';
import { createContext } from './trpc/context';
import { appRouter, type AppRouter } from './trpc/router';
import './common/env.js';
import { ping } from './common/dockerode';

await ping();

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

try {
    server.listen(
        { port: 3000, host: '0.0.0.0' },
        () => console.log('Server is running on http://0.0.0.0:3000'),
    );
} catch (err) {
    server.log.error(err);
    process.exit(1);
}
