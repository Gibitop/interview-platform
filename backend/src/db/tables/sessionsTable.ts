import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';

export const sessionsTable = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => usersTable.id),
    expiresAt: timestamp('expires_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});
