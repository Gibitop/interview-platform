import pty from 'node-pty';
import { workDir } from './storage.js';

let shell: pty.IPty;
let lastData = '';

const onDataHandlers: ((data: string) => void)[] = [];

const setup = () => {
    shell = pty.spawn('bash', [], { cwd: workDir, cols: 80 });
    shell.onData(data => {
        if (data.endsWith('\n')) {
            lastData = data;
        } else {
            lastData += data;
        }
        onDataHandlers.forEach(handler => handler(data));
    });
    shell.onExit(() => setup());
};

setup();

export const getShell = () => shell;
export const getLastData = () => lastData;
export const addOnDataHandler = (handler: (data: string) => void) => {
    onDataHandlers.push(handler);
};
