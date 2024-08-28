import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { implement } from '../utils/implementWithZod';
import type { C2SEvent, S2CEvent } from '../eventNames';

export type Role = 'host' | 'candidate' | 'spectator';
export type User = {
    id: string;
    role: Role;
    name: string;
    color: string;
    line: number;
    char: number;
    isFocused: boolean;
};

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

const zMyUserChange = implement<
    Partial<Pick<User, 'name' | 'line' | 'char' | 'isFocused'>>
>().with({
    name: z.string().optional(),
    char: z.number().optional(),
    line: z.number().optional(),
    isFocused: z.boolean().optional(),
});
export type MyUserChangeRequest = z.infer<typeof zMyUserChange>;

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        const user: User = {
            char: 1,
            line: 1,
            id: socket.id,
            isFocused: false,
            name: '',
            role: 'candidate',
            color: selectColor(),
        };

        // TODO: Check JWT
        if (socket.handshake.auth.token === 'aaa') {
            hostIds.add(socket.id);
            if (socket.handshake.auth.spectatorMode) {
                user.role = 'spectator';
            } else {
                user.role = 'host';
            }
        }

        users.set(socket.id, user);

        socket.once('disconnect', () => {
            hostIds.delete(socket.id);
            returnColor(user.color);
            users.delete(socket.id);
            broadcastUsers(io);
        });

        socket.on('change-my-user' satisfies C2SEvent, (data: unknown) => {
            const parsed = zMyUserChange.safeParse(data);
            if (!parsed.success) {
                return;
            }

            users.set(socket.id, {
                ...users.get(socket.id)!,
                ...parsed.data,
            });
            broadcastUsers(io);
        });
    };

    io.on('connection', connectionListener);
    return () => {
        io.off('connection', connectionListener);
    };
};
