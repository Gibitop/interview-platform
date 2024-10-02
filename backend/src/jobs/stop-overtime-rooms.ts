import { schedule } from 'node-cron';
import { deleteContainer, getActiveRoomIds } from '../common/roomContainers';
import { db } from '../db';
import { roomsTable } from '../db/tables/roomsTable';
import { and, lte, inArray } from 'drizzle-orm';
import { saveRecording } from '../common/recordings';

export const stopOvertimeRooms = schedule('0 * * * *', async () => {
    const activeRoomIds = await getActiveRoomIds();
    const rooms = await db
        .select()
        .from(roomsTable)
        .where(
            and(
                inArray(roomsTable.id, activeRoomIds),
                lte(roomsTable.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
        )

    rooms.forEach(async (room) => {
        await saveRecording(room.id);
        deleteContainer(room.id)
    });
}, { scheduled: false });
