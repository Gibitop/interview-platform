import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db';
import { usersTable } from '../db/tables/usersTable';
import { sessionsTable } from '../db/tables/sessionsTable';
import { env } from './env';

const adapter = new DrizzlePostgreSQLAdapter(db, sessionsTable, usersTable);

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: env.NODE_ENV !== 'development',
        },
    },
    getUserAttributes: attributes => attributes,
});

// IMPORTANT FOR TYPING LUCIA, DO NOT REMOVE
declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: typeof usersTable.$inferSelect;
    }
}
