import { boolean, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { ROOM_TYPES } from '../../common/roomTypes';


export const roomsTable = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),

    type: text('type', { enum: ROOM_TYPES }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    insiderPort: integer('insider_port').notNull(),
    wsPort: integer('ws_port').notNull(),
    httpPort: integer('http_port').notNull(),
});
