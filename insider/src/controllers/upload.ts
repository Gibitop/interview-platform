import type { Server, Socket } from 'socket.io';
import type { C2SEvent } from '../eventNames';
import { writeFile } from 'fs/promises';
import { env } from '../env';
import { getUser } from './users';

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        const uploadListener = (fileName: unknown, fileData: unknown) => {
            if (!fileName || !fileData) return;
            if (typeof fileName !== 'string' || !(fileData instanceof Buffer)) return;
            if (getUser(socket.id)?.role !== 'host') return;

            writeFile(`${env.WORKING_DIRECTORY}/${fileName}`, fileData);
        };
        socket.on('uploadFile' satisfies C2SEvent, uploadListener);

        socket.once('disconnect', () => {
            socket.off('uploadFile' satisfies C2SEvent, uploadListener);
        });
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
    };
};
