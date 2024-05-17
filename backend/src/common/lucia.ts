import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db';
import { usersTable } from '../db/tables/usersTable';
import { sessionsTable } from '../db/tables/sessionsTable';

const adapter = new DrizzlePostgreSQLAdapter(db, sessionsTable, usersTable);

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: process.env.NODE_ENV !== 'development',
        },
    },
    getUserAttributes: attributes => attributes,
});

// IMPORTANT
declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: typeof usersTable.$inferSelect;
    }
}
