import Docker from 'dockerode';
import { type TRoomType, IMAGES } from './roomTypes';
import { env } from './env';
import { humanIdToUuid } from './uuid';
import SuperJSON from './super-json';

const docker = new Docker({ socketPath: env.DOCKER_SOCKET_PATH });
export const ping = () => docker.ping();

const ROOM_PREFIX = 'interview-platform-room-';
const makeContainerName = (roomId: string) => `${ROOM_PREFIX}${roomId.replace(/-/g, '')}`;

export const isContainerActive = async (roomId: string) => {
    const container = docker.getContainer(makeContainerName(roomId));
    const info = await container.inspect().catch(() => null);
    return info?.State.Running ?? false;
};

type RoomInfo = {
    id: string;
    name: string;
    type: TRoomType;
    createdAt: Date;
}

export const createContainer = async ({ createdAt, id, name: roomName, type }: RoomInfo) => {
    const humanRoomId = id.replace(/-/g, '');
    const name = makeContainerName(humanRoomId);

    const traefikPrefix = `/insider/${humanRoomId}`;
    const traefikWsPrefix = `${traefikPrefix}/ws`;

    const additionalLabels: Record<string, string> = {};
    if (env.INSIDER_ADDITIONAL_LABELS) {
        env.INSIDER_ADDITIONAL_LABELS.split('\n')
            .map(label => label.trim().replaceAll('<SERVICE_NAME>', name))
            .filter(Boolean)
            .forEach(label => {
                const [key, value] = label.split('=');
                if (key && value) {
                    additionalLabels[key] = value;
                }
            });
    }

    const container = await docker.createContainer({
        Image: IMAGES[type],
        name,
        Tty: true,
        HostConfig: {
            NetworkMode: 'interview-platform-traefik',
            Binds: [`${env.INSIDER_JWT_PUBLIC_KEY_PATH}:/app/jwt-public-key.pem:ro`],
        },
        Env: [
            `NODE_ENV=${env.NODE_ENV}`,
            `ROOM_INFO=${SuperJSON.stringify({ createdAt, id, name: roomName, type } satisfies RoomInfo)}`,
        ],
        Labels: {
            ...additionalLabels,

            'traefik.enable': 'true',
            [`traefik.http.routers.${name}.rule`]: `(Host(\`${env.DOMAIN}\`) && PathPrefix(\`${traefikWsPrefix}\`))`,
            [`traefik.http.services.${name}.loadbalancer.server.port`]: `${env.INSIDER_WS_PORT}`,
            [`traefik.http.routers.${name}.middlewares`]: `${name}-stripprefix`,
            [`traefik.http.middlewares.${name}-stripprefix.stripprefix.prefixes`]: `${traefikWsPrefix}`,
        },
    });

    await container.start();
};

export const deleteContainer = async (roomId: string) => {
    await docker
        .getContainer(makeContainerName(roomId))
        .stop()
        .catch(() => { });
};

export const getActiveRoomIds = async () => {
    const containers = await docker.listContainers();

    return containers
        .map(container =>
            container.Names.find(name => name.startsWith(`/${ROOM_PREFIX}`))?.replace(
                `/${ROOM_PREFIX}`,
                '',
            ),
        )
        .filter(Boolean)
        .map(humanIdToUuid);
};

export const sendRequestToContainer = async (
    roomId: string,
    path: string,
    requestInit?: RequestInit,
    // TODO: Think of a better way to run this locally without docker
// ) => fetch(`http://${makeContainerName(roomId)}:${env.INSIDER_WS_PORT}/${path}`, requestInit);
) => fetch(`http://localhost:${env.INSIDER_WS_PORT}/${path}`, requestInit);
