import { schedule } from 'node-cron';
import { deleteContainer, getActiveRoomIds } from '../common/dockerode';
import { db } from '../db';
import { roomsTable } from '../db/tables/roomsTable';
import { and, lte, inArray } from 'drizzle-orm';

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
    rooms.forEach(room => deleteContainer(room.id));
}, { scheduled: false });
