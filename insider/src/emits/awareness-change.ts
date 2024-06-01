import type { Server } from 'socket.io';
import { hostIds, sendEvent, users, type Role } from '../sockets.js';
import { awarenessStorage, type Awareness } from '../storage.js';

export type AwarenessResponse = (Awareness & { id: string; role: Role })[];

export const emitAwarenessChange = (io: Server) => {
    const newData = awarenessStorage.get();

    const awarenessForHosts: AwarenessResponse = Object.entries(newData).map(([id, data]) => ({
        id,
        role: users.get(id)!.role,
        ...data,
    }));
    sendEvent(io, 'awareness-change', awarenessForHosts, ['host', 'spectator']);

    const awarenessForCandidates: AwarenessResponse = awarenessForHosts
        .filter(({ role }) => role !== 'spectator')
        .map(data => ({
            ...data,
            isFocused: data.isFocused || hostIds.has(data.id),
        }));
    sendEvent(io, 'awareness-change', awarenessForCandidates, ['candidate']);
};
