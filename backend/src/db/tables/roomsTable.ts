import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { ROOM_TYPES } from '../../common/roomTypes';


export const roomsTable = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),

    recordingPath: text('recording_path'),

    type: text('type', { enum: ROOM_TYPES }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});
