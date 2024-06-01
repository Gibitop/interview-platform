import { z } from 'zod';
import { awarenessStorage, type Awareness } from '../storage.js';
import { implement } from '../utils/implementWithZod.js';
import type { Server, Socket } from 'socket.io';
import { emitAwarenessChange } from '../emits/awareness-change.js';

const zMyAwarenessChange = implement<
    Partial<Pick<Awareness, 'name' | 'line' | 'char' | 'isFocused'>>
>().with({
    name: z.string().optional(),
    char: z.number().optional(),
    line: z.number().optional(),
    isFocused: z.boolean().optional(),
});

export type MyAwarenessChangeRequest = z.infer<typeof zMyAwarenessChange>;

export const myAwarenessChange = (io: Server, socket: Socket, data: unknown) => {
    const parsed = zMyAwarenessChange.safeParse(data);
    if (!parsed.success) {
        return;
    }

    awarenessStorage.set(socket.id, parsed.data);
    emitAwarenessChange(io);
};
