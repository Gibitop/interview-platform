import { readdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { sendRequestToContainer } from './roomContainers';
import { env } from './env';
import { db } from '../db';
import { roomsTable } from '../db/tables/roomsTable';
import { eq } from 'drizzle-orm';
import { uuidToHumanId } from './uuid';
import { generateInsiderToken } from './tokens';

const recordingExtension = '.json.gz'
const makeRecordingPath = (roomUuid: string) =>
    `${env.RECORDINGS_DIR}/${uuidToHumanId(roomUuid)}${recordingExtension}`;

export const saveRecording = async (roomUuid: string) => {
    const recording = await sendRequestToContainer(
        roomUuid,
        `recording?${new URLSearchParams({ token: await generateInsiderToken(uuidToHumanId(roomUuid)) })}`,
    )
        .then(res => res?.blob())
        .then(res => res.arrayBuffer())
        .catch(console.error);

    if (!recording) {
        throw new Error('Failed to get recording data');
    }

    await deleteRecording(roomUuid);

    const recordingPath = makeRecordingPath(roomUuid);

    await db.transaction(async tx => {
        await tx.update(roomsTable).set({ recordingPath }).where(eq(roomsTable.id, roomUuid));
        await writeFile(recordingPath, Buffer.from(recording), { flag: 'w' });
    });
};

export const deleteRecording = async (roomUuid: string) => {
    const recordingPath = makeRecordingPath(roomUuid);

    if (existsSync(recordingPath)) {
        await db.transaction(async tx => {
            await tx.update(roomsTable).set({ recordingPath }).where(eq(roomsTable.id, roomUuid));
            await rm(recordingPath);
        });
    }
};

export const getRecording = async (roomUuid: string) => {
    const recordingPath = makeRecordingPath(roomUuid);

    if (!existsSync(recordingPath)) return undefined;

    const buffer = await readFile(recordingPath);
    return new Uint8Array(buffer);
};

export const getRecordingsRoomsList = async () => {
    const files = await readdir(env.RECORDINGS_DIR);
    return files.map(file => file.replace(recordingExtension, ''));
};
