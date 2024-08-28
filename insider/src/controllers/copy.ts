import type { Server, Socket } from 'socket.io';
import { broadcastToRoles } from './users';
import type { C2SEvent, S2CEvent } from '../eventNames';

export const setup = (io: Server) => {
    const connectionHandler = (socket: Socket) => {
        socket.on('copy' satisfies C2SEvent, () => {
            broadcastToRoles(io, 'candidate-copied' satisfies S2CEvent, socket.id, ['host', 'spectator']);
        });
    };

    io.on('connection', connectionHandler);

    return () => {
        io.off('connection', connectionHandler);
    };
};
