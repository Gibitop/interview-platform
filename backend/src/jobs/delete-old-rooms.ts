import { schedule } from 'node-cron';
import { db } from '../db';
import { deleteRecording } from '../common/recordings';
import { roomsTable } from '../db/tables/roomsTable';
import { and, eq, inArray, lte } from 'drizzle-orm';

export const deleteOldRooms = schedule('0 0 * * *', async () => {
    const rooms = await db
        .select()
        .from(roomsTable)
        .where(
            and(
                lte(roomsTable.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            ),
        );

    rooms.forEach(async room => {
        await deleteRecording(room.id);
        await db
            .delete(roomsTable)
            .where(eq(roomsTable.id, room.id));
    });
});
