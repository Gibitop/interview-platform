import fastify, { type FastifyPluginAsync } from 'fastify';
import fastifyIO from 'fastify-socket.io';
import type { ServerOptions, Server as SocketIoServer } from 'socket.io';
import { setup as setupUsers } from './controllers/users';
import { setup as setupActiveFileContent } from './controllers/activeFileContent';
import { setup as setupActiveFilePath } from './controllers/activeFilePath';
import { setup as setupTerminal } from './controllers/terminal';
import { setup as setupUpload } from './controllers/upload';
import { setup as setupCopy } from './controllers/copy';
import { getRecording, startRecording } from './recorder';
import { validateBackendJwt } from './utils/validateHostJwt';

declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIoServer;
    }
}

const server = fastify();
server.register(fastifyIO as unknown as FastifyPluginAsync<Partial<ServerOptions>>, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 1000 * 60 * 2,
    },
});

server.get('/', async () => {
    return { hello: 'world' };
});

server.get<{ Querystring: { token: string } }>('/recording', async (req, res) => {
    if (!(await validateBackendJwt(req.query.token))) {
        res.status(401).send('Unauthorized');
        return;
    }

    res.header('Content-Type', 'application/octet-stream');
    return getRecording();
});

server.setErrorHandler((error, req, res) => {
    console.error(error);
    res.status(500).send('Internal Server Error');
});

server.ready().then(() => {
    setupUsers(server.io);
    setupCopy(server.io);
    setupActiveFilePath(server.io);
    setupActiveFileContent(server.io);
    setupTerminal(server.io);
    setupUpload(server.io);

    startRecording();
});

server.listen({ port: 5050, host: '0.0.0.0' }, err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Server is running on port 5050');
});
