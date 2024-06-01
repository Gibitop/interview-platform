import type { Server } from 'socket.io';
import {
    activeFileContentStorage,
    activeFilePathStorage,
    awarenessStorage,
    type Awareness,
} from './storage.js';
import { myAwarenessChange } from './eventHandlers/my-awareness-change.js';
import { addOnDataHandler, getLastData, getShell } from './terminal.js';
import { Patch, type ITimestampStruct } from 'json-joy/lib/json-crdt';
import { getMissedPatches, pushPatch } from './history.js';

export type Role = 'host' | 'candidate' | 'spectator';

export type User = {
    role: Role;
};

export const users = new Map<string, User>();

export const hostIds = new Set<string>();
export const candidateIds = new Set<string>();
export const spectatorIds = new Set<string>();

export const sendEvent = (
    io: Server,
    event: string,
    data: unknown,
    roles: Role[] = ['candidate', 'host', 'spectator'],
) => {
    for (const [id, user] of users) {
        if (roles.includes(user.role)) {
            io.to(id).emit(event, data);
        }
    }
};

export type MyAwarenessChangeRequest = Pick<Awareness, 'name' | 'line' | 'char' | 'isFocused'>;

const colors = ['#1E40AF', '#6B21A8', '#166534', '#991B1B', '#334155'];
const unusedColors = [...colors];

export const setup = (io: Server) => {
    io.on('connection', socket => {
        if (socket.handshake.auth.token === 'aaa') {
            if (socket.handshake.auth.spectatorMode) {
                users.set(socket.id, {
                    role: 'spectator',
                });
                spectatorIds.add(socket.id);
            } else {
                users.set(socket.id, {
                    role: 'host',
                });
                hostIds.add(socket.id);
            }
        } else {
            users.set(socket.id, {
                role: 'candidate',
            });
            candidateIds.add(socket.id);
        }

        const color = unusedColors.shift() ?? colors[Math.floor(Math.random() * colors.length)];
        awarenessStorage.set(socket.id, {
            name: 'Unknown',
            line: 1,
            char: 1,
            isFocused: false,
            color,
        });

        if (socket.recovered) {
            console.log('Recovered');
        } else {
            console.log('New session');
            socket.emit('active-file-content-rewrite', activeFileContentStorage.getBinaryModel());
        }

        socket.on('request-active-file-content', () => {
            socket.emit('active-file-content-rewrite', activeFileContentStorage.getBinaryModel());
        });

        socket.emit('terminal-output', getLastData());

        socket.on('disconnect', () => {
            switch (users.get(socket.id)?.role) {
                case 'host':
                    hostIds.delete(socket.id);
                    break;
                case 'candidate':
                    candidateIds.delete(socket.id);
                    break;
                case 'spectator':
                    spectatorIds.delete(socket.id);
                    break;
            }

            const color = awarenessStorage.get()[socket.id]!.color;
            if (!unusedColors.includes(color)) {
                unusedColors.unshift(color);
            }
            awarenessStorage.delete(socket.id);
            users.delete(socket.id);
        });

        socket.on('active-file-content-patch', data => {
            if (users.get(socket.id)?.role === 'spectator') {
                return;
            }
            activeFileContentStorage.applyBinaryPatch(data);
            pushPatch(Patch.fromBinary(data));
            socket.broadcast.emit('active-file-content-patch', data);
        });

        socket.on('active-file-content-recover', (lastPatchTime: ITimestampStruct['time']) => {
            getMissedPatches(lastPatchTime).forEach(patch => {
                socket.emit('active-file-content-patch', patch);
            });
        });

        socket.on('active-file-path-change', data => {
            if (users.get(socket.id)?.role !== 'host') {
                return;
            }
            activeFilePathStorage.set(data);
            socket.broadcast.emit('active-file-path-change', data);
        });

        socket.on('copy', () => {
            sendEvent(io, 'candidate-copy', socket.id, ['host', 'spectator']);
        });

        socket.on('my-awareness-change', (data: unknown) => myAwarenessChange(io, socket, data));

        socket.on('terminal-input', (data: string) => {
            getShell().write(data);
        });
    });

    addOnDataHandler(data => {
        io.emit('terminal-output', data);
    });
};
