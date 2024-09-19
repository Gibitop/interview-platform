import Docker from 'dockerode';
import { type TRoomType, IMAGES } from './roomTypes';
import { env } from './env';

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
    if (env.INSIDER_ADDITIONAL_LABELS) {
        env.INSIDER_ADDITIONAL_LABELS
            .split('\n')
            .map((label) => label.trim())
            .filter(Boolean)
            .forEach((label) => {
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
            NetworkMode: "interview-platform-traefik",
            // AutoRemove: true,
            Binds: [`${env.INSIDER_JWT_PUBLIC_KEY_PATH}:/app/jwt-public-key.pem`],
        },
        Env: [`NODE_ENV=${env.NODE_ENV}`],
        Labels: {
            ...additionalLabels,

            'traefik.enable': 'true',
            [`traefik.http.routers.${name}.rule`]: `(Host(\`${env.DOMAIN}\`) && PathPrefix(\`${traefikWsPrefix}\`))`,
            [`traefik.http.services.${name}.loadbalancer.server.port`]: `${env.INSIDER_WS_PORT}`,
            [`traefik.http.routers.${name}.middlewares`]: `${name}-stripprefix`,
            [`traefik.http.middlewares.${name}-stripprefix.stripprefix.prefixes`]: `${traefikWsPrefix}`,
        }
    });

    await container.start();
};

export const deleteContainer = async (roomId: string) => {
    await docker.getContainer(makeContainerName(roomId)).stop().catch(() => {});
};

export const getContainers = async () => {};
