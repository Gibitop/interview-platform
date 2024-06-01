import fastify, { type FastifyPluginAsync } from 'fastify';
import fastifyIO from 'fastify-socket.io';
import type { ServerOptions, Server as SocketIoServer } from 'socket.io';
import { setup as socketSetup } from './sockets.js';

declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIoServer;
    }
}

const server = fastify();
server.register(
    fastifyIO as unknown as FastifyPluginAsync<Partial<ServerOptions>>,
    {connectionStateRecovery: {
        maxDisconnectionDuration: 1000 * 60 * 2,
    }},
);

server.get('/', async () => {
    return { hello: 'world' };
});

server.ready().then(() => {
    socketSetup(server.io);
});

server.listen({ port: 5001 }, () => console.log('Server is running on port 5001'));
