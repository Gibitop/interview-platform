import type { Server, Socket } from 'socket.io';
import type { C2SEvent, S2CEvent } from '../eventNames';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import { zChangeMyUserRequest, type Role, type User } from '../types/users';


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
    roles: Role[] = ['candidate', 'host', 'spectator'],
) => {
    for (const [id, user] of users) {
        if (roles.includes(user.role)) {
            io.to(id).emit(event, data);
        }
    }
};

const broadcastUsers = (io: Server) => {
    const userForHosts = [...users.values()];
    broadcastToRoles(io, 'users-changed' satisfies S2CEvent, userForHosts, ['host', 'spectator']);

    const userForCandidates: User[] = userForHosts
        .filter(({ role }) => role !== 'spectator')
        .map(data => ({
            ...data,
            isFocused: data.isFocused || hostIds.has(data.id),
        }));
    broadcastToRoles(io, 'users-changed' satisfies S2CEvent, userForCandidates, ['candidate']);
};

const validateHostJwt = async (token: string): Promise<boolean> => {
    try {
        const parsed: (jwt.JwtPayload & { roomId?: string }) | string = jwt.verify(
            token,
            await readFile('./jwt-public-key.pem', 'utf-8'),
            { algorithms: ['RS256'] }
        );
        if (typeof parsed !== 'object') return false;

        // Maybe add roomId validation

        return true
    } catch(e) {
        return false;
    }
}

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

        if (await validateHostJwt(socket.handshake.auth.token)) {
            hostIds.add(socket.id);
            if (socket.handshake.auth.spectatorMode) {
                user.role = 'spectator';
            } else {
                user.role = 'host';
            }
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
