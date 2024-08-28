import pty from 'node-pty';
import type { Server, Socket } from 'socket.io';
import { workDir } from '../config';
import type { C2SEvent, S2CEvent } from '../eventNames';

let shell: pty.IPty | undefined;
let lastData = '';

const onDataHandlers: ((data: string) => void)[] = [];

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
        socket.on('input-to-terminal' satisfies C2SEvent, (data: string) => {
            shell!.write(data);
        });

        const onDataHandler: (typeof onDataHandlers[number]) = data => {
            socket.emit('terminal-outputted' satisfies S2CEvent, data);
        };
        onDataHandlers.push(onDataHandler);

        socket.once('disconnect', () => {
            const handlerIndex = onDataHandlers.indexOf(onDataHandler);
            if (handlerIndex === -1) return;
            onDataHandlers.splice(handlerIndex, 1);
        });


        socket.emit('terminal-outputted' satisfies S2CEvent, lastData);
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
    };
};
