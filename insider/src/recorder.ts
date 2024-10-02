import { io } from 'socket.io-client';
import SuperJSON from './utils/super-json';
import type { C2SEvent, S2CEvent } from './eventNames';
import type { RecordedEvent, Recording } from './types/recording';
import { env } from './env';
import { readFileSync } from 'fs';
import type packageJson from '../package.json';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as typeof packageJson;


let startTimestampMs = Date.now();
let recording: RecordedEvent[] = [];

export const startRecording = () => {
    startTimestampMs = Date.now();
    recording = [];

    const socket = io(`ws://127.0.0.1:5050`, {
        auth: { recorderMode: true },
    });

    const listener = (event: S2CEvent, ...args: unknown[]) => {
        recording.push({
            timestampMs: Date.now() - startTimestampMs,
            event,
            args: args.map(arg => arg instanceof Buffer ? Uint8Array.from(arg) : arg),
        });
    };

    socket.onAny(listener);

    socket.emit('request-active-file-path' satisfies C2SEvent);
    socket.emit('request-available-files' satisfies C2SEvent);
    socket.emit('request-active-file-content' satisfies C2SEvent);

    return () => {
        socket.offAny(listener);
        socket.close();
    };
};

export const getRecording = async () => {
    const serialized = SuperJSON.stringify({
        recordingVersion: 1,
        platformVersion: version,
        roomInfo: env.ROOM_INFO,
        recording,
    } satisfies Recording);

    const cs = new CompressionStream('gzip');

    const writer = cs.writable.getWriter();
    writer.write(serialized);
    writer.close();

    const chunks = [];
    for await (const chunk of cs.readable) {
        chunks.push(chunk);
    }

    const buffer = await new Blob(chunks).arrayBuffer();
    return new Uint8Array(buffer);
}
