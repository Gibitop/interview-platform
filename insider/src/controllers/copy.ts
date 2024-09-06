import type { Server, Socket } from 'socket.io';
import { broadcastToRoles, getUser } from './users';
import type { C2SEvent, S2CEvent } from '../eventNames';

export const setup = (io: Server) => {
    const connectionHandler = (socket: Socket) => {
        const candidateCopyListener = () => {
            if (getUser(socket.id)?.role !== 'candidate') return;

            broadcastToRoles(io, 'candidate-copied' satisfies S2CEvent, socket.id, ['host', 'spectator']);
        };
        socket.on('copy' satisfies C2SEvent, candidateCopyListener);

        socket.once('disconnect', () => {
            socket.off('copy' satisfies C2SEvent, candidateCopyListener);
        });
    };

    io.on('connection', connectionHandler);

    return () => {
        io.off('connection', connectionHandler);
    };
};
