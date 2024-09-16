import Docker from 'dockerode';
import { type TRoomType, IMAGES } from './roomTypes';
import { env } from './env';

const INSIDER_CONTROL_PORT = 4040;
const WS_PORT = 5050;
const FREE_TCP_PORT = 8080;


const docker = new Docker({ socketPath: env.DOCKER_SOCKET_PATH });
export const ping = () => docker.ping();

const makeContainerName = (roomId: string) => `interview-platform-room-${roomId.replace(/-/g, '')}`;

export const isContainerActive = async (roomId: string) => {
    const container = docker.getContainer(makeContainerName(roomId));
    const info = await container.inspect().catch(() => null);
    return info?.State.Running ?? false;
}

export const createContainer = async (
    roomId: string,
    type: TRoomType,
) => {
    const humanRoomId = roomId.replace(/-/g, '');
    const name = makeContainerName(humanRoomId);

    const traefikPrefix = `/insider/${humanRoomId}`;
    const traefikWsPrefix = `${traefikPrefix}/ws`;

    const additionalLabels: Record<string, string> = {};
    if (process.env.INSIDER_LABELS) {
        process.env.INSIDER_LABELS.split('::').forEach((label) => {
            const [key, value] = label.split('=');
            if (!key || !value) return;
            additionalLabels[key] = value;
        });
    }

    const container = await docker.createContainer({
        Image: IMAGES[type],
        name,
        Tty: true,
        HostConfig: {
            NetworkMode: "interview-platform-traefik"
        },
        Labels: {
            ...additionalLabels,

            // TODO: Env validation
            'traefik.enable': 'true',
            [`traefik.http.routers.${name}.rule`]: `(Host(\`${process.env.DOMAIN}\`) && PathPrefix(\`${traefikWsPrefix}\`))`,
            [`traefik.http.services.${name}.loadbalancer.server.port`]: `${WS_PORT}`,
            [`traefik.http.routers.${name}.middlewares`]: `${name}-stripprefix`,
            [`traefik.http.middlewares.${name}-stripprefix.stripprefix.prefixes`]: `${traefikWsPrefix}`,
        }
    });

    await container.start();
    container.wait({ condition: 'not-running' }).then(() => {
        container.remove().catch(() => { });
    });
};

export const deleteContainer = async (roomId: string) => {
    await docker.getContainer(makeContainerName(roomId)).stop();
};

export const getContainers = async () => { };
