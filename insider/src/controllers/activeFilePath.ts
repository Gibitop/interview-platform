import type { Server, Socket } from 'socket.io';
import { getUser } from './users';
import {
    broadcastPendingPatch as broadcastActiveFileContentPendingPatch,
    replace as replaceActiveFileContent,
} from './activeFileContent';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { workDir } from '../config';
import type { C2SEvent, S2CEvent } from '../eventNames';

let activeFilePath = `${workDir}/test.txt`;

export const getActiveFilePath = () => activeFilePath;

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        socket.on('change-active-file-path' satisfies C2SEvent, data => {
            if (typeof data !== 'string') return;
            if (getUser(socket.id)?.role !== 'host') return;

            activeFilePath = data;
            socket.broadcast.emit('active-file-path-changed' satisfies S2CEvent, data);

            // Update active file content
            if (!existsSync(data)) {
                writeFileSync(data, '');
            }
            replaceActiveFileContent(readFileSync(data, 'utf-8'));
            broadcastActiveFileContentPendingPatch(io);
        });
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
    };
};
