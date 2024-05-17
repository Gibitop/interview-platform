import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from '../db';
import { usersTable } from '../db/tables/usersTable';
import { eq } from 'drizzle-orm';
import { hash, verify } from './hashing';

passport.use(
    new LocalStrategy(async (email, password, cb) => {
        try {
            const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
            if (!users[0]) {
                return cb(null, false);
            }

            if (!(await verify(users[0].hashedPassword, password))) {
                return cb(null, false);
            }
            return cb(null, users[0]);
        } catch (e) {
            return cb(e);
        }
    }),
);

export const authenticate = passport.framework()