import pty from 'node-pty';
import type { Server, Socket } from 'socket.io';
import { workDir } from '../config';
import type { C2SEvent, S2CEvent } from '../eventNames';
import { getUser } from './users';

let shell: pty.IPty | undefined;
let lastData = '';

type OnDataHandler = (data: string) => void;
const onDataHandlers: Set<OnDataHandler> = new Set();

const createShell = () => {
    shell = pty.spawn('bash', [], { cwd: workDir, cols: 80 });
    shell.onData(data => {
        if (data.endsWith('\n')) {
            lastData = data;
        } else {
            lastData += data;
        }
        onDataHandlers.forEach(handler => handler(data));
    });
    shell.onExit(() => createShell());
};

export const setup = (io: Server) => {
    if (!shell) createShell();

    const connectionListener = (socket: Socket) => {
        const inputToTerminalListener = (data: unknown) => {
            if (typeof data !== 'string') return;
            if (getUser(socket.id)?.role !== 'host') return;

            shell!.write(data);
        };
        socket.on('input-to-terminal' satisfies C2SEvent, inputToTerminalListener);

        const onDataHandler: OnDataHandler = data => {
            socket.emit('terminal-outputted' satisfies S2CEvent, data);
        };
        onDataHandlers.add(onDataHandler);

        socket.once('disconnect', () => {
            socket.off('input-to-terminal' satisfies C2SEvent, inputToTerminalListener);
            onDataHandlers.delete(onDataHandler);
        });

        socket.emit('terminal-outputted' satisfies S2CEvent, lastData);
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
        onDataHandlers.clear();
    };
};
