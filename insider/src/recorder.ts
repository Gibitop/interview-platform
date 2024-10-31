import { io } from 'socket.io-client';
import SuperJSON from './utils/super-json';
import type { C2SEvent, S2CEvent } from './eventNames';
import type { RecordedEvent, Recording } from './types/recording';
import { env } from './env';
import { existsSync, openSync, readFileSync } from 'fs';
import type packageJson from '../package.json';
import { appendFile } from 'fs/promises';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as typeof packageJson;

const RECORDING_RECOVERY_PATH = `${env.PERSISTENCE_DIRECTORY_PATH}/recording-recovery`;


let startTimestampMs = Date.now();
let recording: RecordedEvent[] = [];

if (existsSync(RECORDING_RECOVERY_PATH)) {
    const text = readFileSync(RECORDING_RECOVERY_PATH, 'utf-8');
    let lastEvent: RecordedEvent | null = null;
    for (const line of text.split('\n')) {
        if (!line) {
            continue;
        }

        const event = SuperJSON.parse(line) as RecordedEvent;
        lastEvent = event;

        recording.push(event);
    }

    if (lastEvent) {
        startTimestampMs = Date.now() - lastEvent.timestampMs;
    }

    console.log(`Recovered ${recording.length} events from ${RECORDING_RECOVERY_PATH}`);
}

export const startRecording = () => {
    const socket = io(`ws://127.0.0.1:5050`, {
        auth: { recorderMode: true },
    });

    const listener = async (event: S2CEvent, ...args: unknown[]) => {
        const timestampMs = Date.now() - startTimestampMs;

        await appendFile(
            RECORDING_RECOVERY_PATH,
            SuperJSON.stringify({ event, args, timestampMs } satisfies RecordedEvent) + '\n'
        );

        recording.push({
            timestampMs,
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
