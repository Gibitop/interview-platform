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
            RestartPolicy: { Name: 'always' },
            NetworkMode: 'interview-platform-traefik',
            Binds: [`${env.INSIDER_JWT_PUBLIC_KEY_PATH}:/app/jwt-public-key.pem:ro`],
            Mounts: [
                {
                    Type: 'volume',
                    Source: `${name}-persistence`,
                    Target: env.INSIDER_PERSISTENCE_DIRECTORY_PATH,
                    ReadOnly: false,
                },
                {
                    Type: 'volume',
                    Source: `${name}-working-directory`,
                    Target: env.INSIDER_WORKING_DIRECTORY,
                    ReadOnly: false,
                }
            ],
        },
        Volumes: {
            [env.INSIDER_PERSISTENCE_DIRECTORY_PATH]: {},
            [env.INSIDER_WORKING_DIRECTORY]: {},
        },
        Env: [
            `NODE_ENV=${env.NODE_ENV}`,
            `ROOM_INFO=${SuperJSON.stringify({ createdAt, id, name: roomName, type } satisfies RoomInfo)}`,
            `PERSISTENCE_DIRECTORY_PATH=${env.INSIDER_PERSISTENCE_DIRECTORY_PATH}`,
            `WORKING_DIRECTORY=${env.INSIDER_WORKING_DIRECTORY}`,
            `START_ACTIVE_FILE_NAME=${env.INSIDER_START_ACTIVE_FILE_NAME}`,
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
    const container = docker.getContainer(makeContainerName(roomId));

    await container.stop().catch((e) => {
        console.error(`Failed to stop container ${makeContainerName(roomId)}`, e);
    });

    await container.remove().catch((e) => {
        console.error(`Failed to remove container ${makeContainerName(roomId)}`, e);
    });

    const name = makeContainerName(roomId.replace(/-/g, ''));
    await Promise.all([
        docker.getVolume(`${name}-persistence`).remove(),
        docker.getVolume(`${name}-working-directory`).remove(),
    ]).catch((e) => {
        console.error(`Failed to remove volumes for container ${makeContainerName(roomId)}`, e);
    });
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
) => fetch(
    env.USE_LOCALHOST_INSIDER
        ? `http://localhost:${env.INSIDER_WS_PORT}/${path}`
        : `http://${makeContainerName(roomId)}:${env.INSIDER_WS_PORT}/${path}`,
    requestInit,
);
