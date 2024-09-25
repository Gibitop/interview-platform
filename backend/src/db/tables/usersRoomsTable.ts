import { boolean, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { roomsTable } from './roomsTable';
import { usersTable } from './usersTable';


export const usersRoomsTable = pgTable(
    'users_rooms',
    {
        roomId: uuid('room_id')
            .notNull()
            .references(() => roomsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

        userId: uuid('user_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

        /**
         * If true, the interviewee will not see this user in the list of room participants.
         * Other logged-in users will see this user
         */
        isStealthy: boolean('is_stealthy').notNull(),
    },
    self => ({
        primaryKey: primaryKey({ columns: [self.roomId, self.userId] }),
    }),
);
