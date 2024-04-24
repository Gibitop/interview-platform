import Docker from 'dockerode';
import fastify from 'fastify';
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { set, z } from 'zod';

const containerTypes = ['js' /*  'java' */] as const;
const containerTypeToImage: Record<(typeof containerTypes)[number], string> = {
    js: 'node:20-alpine',
    // java: 'openjdk:11',
};

const innerWsPort = 3000;
const innerHttpPort = 3001;

const startPort = 4000;
const takenPorts = new Set<number>();
const MAX_PORT = 65535;

const runningContainers = new Set<string>();

const dockerSocket = process.env.DOCKER_SOCKET;
const docker = new Docker({ socketPath: dockerSocket });
docker.ping();

await Promise.all(Object.values(containerTypeToImage).map(image => docker.pull(image)));

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>().post(
    '/create-room',
    {
        schema: {
            body: z.object({
                roomId: z.string(),
                roomType: z.enum(containerTypes),
            }),
            response: {
                200: z.object({
                    wsPort: z.number(),
                    httpPort: z.number(),
                }),
            },
        },
    },
    async (req, res) => {
        const { roomId, roomType } = req.body;

        let wsPort = -1;
        let httpPort = -1;
        for (let i = startPort; i < MAX_PORT; i++) {
            if (takenPorts.has(i)) continue;
            takenPorts.add(i);

            if (wsPort === -1) {
                wsPort = i;
            } else if (httpPort === -1) {
                httpPort = i;
                break;
            }
        }

        const container = await docker.createContainer({
            Image: containerTypeToImage[roomType],
            Cmd: ['npx', '-y', 'serve', '-p', httpPort.toString(), '.'],
            name: `room-${roomId}`,
            ExposedPorts: { [`${innerWsPort}/tcp`]: {}, [`${innerHttpPort}/tcp`]: {} },
            HostConfig: {
                PortBindings: {
                    [`${innerWsPort}/tcp`]: [{ HostPort: wsPort.toString(), HostIp: '0.0.0.0' }],
                    [`${innerHttpPort}/tcp`]: [
                        { HostPort: httpPort.toString(), HostIp: '0.0.0.0' },
                    ],
                },
            },
            Tty: true,
        });

        await container.start();
        runningContainers.add(container.id);
        container.wait({ condition: 'not-running' }).then(async () => {
            await container.remove();
            runningContainers.delete(container.id);
        });

        return { wsPort, httpPort };
    },
);

app.withTypeProvider<ZodTypeProvider>().post(
    '/delete-room',
    {
        schema: {
            body: z.object({
                roomId: z.string(),
            }),
        },
    },
    async (req, res) => {
        const { roomId } = req.body;

        const container = docker.getContainer(`room-${roomId}`);
        const info = await container.inspect();
        const ports = Object.values(info.HostConfig.PortBindings).map(bind =>
            Number((bind as [{ HostPort: string }])[0].HostPort),
        );
        await container.stop();
        ports.forEach(port => takenPorts.delete(port));
    },
);

const cleanup = async () => {
    await Promise.all(Array.from(runningContainers).map(id => docker.getContainer(id).stop()));
};
process.on('beforeExit', () => cleanup().catch(console.error));
process.on('SIGINT', () => cleanup().catch(console.error));

app.listen({ port: 3000 }, () => console.log('Listening on 3000'));
