import type { Server, Socket } from 'socket.io';
import type { C2SEvent, S2CEvent } from '../eventNames';
import { zChangeMyUserRequest, type Role, type User } from '../types/users';
import { validateBackendJwt } from '../utils/validateHostJwt';

const users = new Map<string, User>();
const hostIds = new Set<string>();

export const getUser = (id: string) => users.get(id);
export const getUsers = () => [...users.values()];

const colors = ['#AE022B', '#571BB8', '#0051B5', '#006627', '#3F5676'];
const unusedColors = [...colors];

const selectColor = () =>
    unusedColors.shift() ?? colors[Math.floor(Math.random() * colors.length)]!;

const returnColor = (color: string) => {
    if (!unusedColors.includes(color)) {
        unusedColors.unshift(color);
    }
};

export const broadcastToRoles = (
    io: Server,
    event: S2CEvent,
    data: unknown,
    roles: Role[] = ['candidate', 'host', 'spectator', 'recorder'],
) => {
    for (const [id, user] of users) {
        if (roles.includes(user.role)) {
            io.to(id).emit(event, data);
        }
    }
};

const broadcastUsers = (io: Server) => {
    const userForHosts = [...users.values()].filter(({ role }) => role !== 'recorder');
    broadcastToRoles(io, 'users-changed' satisfies S2CEvent, userForHosts, ['host', 'spectator', 'recorder']);

    const userForCandidates: User[] = userForHosts
        .filter(({ role }) => role !== 'spectator')
        .map(data => ({
            ...data,
            isFocused: data.isFocused || hostIds.has(data.id),
        }));
    broadcastToRoles(io, 'users-changed' satisfies S2CEvent, userForCandidates, ['candidate']);
};

export const setup = (io: Server) => {
    const connectionListener = async (socket: Socket) => {
        const user: User = {
            id: socket.id,
            isFocused: false,
            name: '',
            role: 'candidate',
            selection: {
                startLine: 1,
                startChar: 1,
                endLine: 1,
                endChar: 1,
            },
            color: selectColor(),
        };

        if (await validateBackendJwt(socket.handshake.auth.token)) {
            hostIds.add(socket.id);
            if (socket.handshake.auth.spectatorMode) {
                user.role = 'spectator';
            } else {
                user.role = 'host';
            }
        } else if (socket.handshake.auth.recorderMode && socket.client.conn.remoteAddress === '127.0.0.1') {
            hostIds.add(socket.id);
            user.role = 'recorder';
        }


        users.set(socket.id, user);

        const changeMuUserListener = (data: unknown, cb?: unknown) => {
            if (cb && cb instanceof Function) {
                cb();
            }

            const parsed = zChangeMyUserRequest.safeParse(data);
            if (!parsed.success) {
                return;
            }

            users.set(socket.id, {
                ...users.get(socket.id)!,
                ...parsed.data,
            });
            broadcastUsers(io);
        };
        socket.on('change-my-user' satisfies C2SEvent, changeMuUserListener);

        socket.once('disconnect', () => {
            socket.off('change-my-user' satisfies C2SEvent, changeMuUserListener);
            hostIds.delete(socket.id);
            returnColor(user.color);
            users.delete(socket.id);
            broadcastUsers(io);
        });
    };

    io.on('connection', connectionListener);
    return () => {
        io.off('connection', connectionListener);
    };
};
