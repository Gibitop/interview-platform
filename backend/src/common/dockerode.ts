import Docker from 'dockerode';
import { type TRoomType, IMAGES } from './roomTypes';
import { env } from './env';

const INSIDER_CONTROL_PORT = 4000;
const WS_PORT = 5000;
const FREE_TCP_PORT = 8080;


const docker = new Docker({ socketPath: env.DOCKER_SOCKET_PATH });
export const ping = () => docker.ping();

export const createContainer = async (
    roomId: string,
    type: TRoomType,
    outerInsiderControlPort: number,
    outerWsPort: number,
    outerFreeTcpPort: number,
) => {
    const container = await docker.createContainer({
        Image: IMAGES[type],
        // TODO: Start insider
        // Cmd: ['bash'],
        name: `room-${roomId}`,
        ExposedPorts: {
            [`${INSIDER_CONTROL_PORT}/tcp`]: {},
            [`${WS_PORT}/tcp`]: {},
            [`${FREE_TCP_PORT}/tcp`]: {},
        },
        Tty: true,
        HostConfig: {
            PortBindings: {
                [`${INSIDER_CONTROL_PORT}/tcp`]: [{ HostPort: outerInsiderControlPort.toString() }],
                // TODO: Replace 0.0.0.0 after setting up nginx reverse proxy
                [`${WS_PORT}/tcp`]: [{ HostPort: outerWsPort.toString(), HostIp: '0.0.0.0' }],
                [`${FREE_TCP_PORT}/tcp`]: [
                    { HostPort: outerFreeTcpPort.toString(), HostIp: '0.0.0.0' },
                ],
            },
        },
    });

    await container.start();
    console.log('Container started');
    container.wait({ condition: 'not-running' }).then(() => {
        console.log('Container stopped');
        // container.remove();
    });
};

export const deleteContainer = async (roomId: string) => {
    await docker.getContainer(`room-${roomId}`).stop();
};

export const getContainers = async () => {};
