import { z } from 'zod';
import { protectedProcedure, publicProcedure, t } from '../utils';
import { db } from '../../db';
import { usersTable } from '../../db/tables/usersTable';
import { eq } from 'drizzle-orm';
import { hash, verify } from '../../common/hashing';
import { lucia } from '../../common/lucia';
import { TRPCError } from '@trpc/server';
import { env } from '../../common/env';

export const authRouter = t.router({
    register: publicProcedure
        .input(
            z.object({
                name: z.string().min(1).max(255),
                username: z.string().regex(/^[a-z0-9_-]{4,31}$/, { message: 'Invalid username' }),
                password: z.string().min(6).max(255),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const foundUsers = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.username, input.username));
            if (foundUsers[0]) {
                throw new TRPCError({ code: 'CONFLICT', message: 'Username already exists' });
            }

            const [newUser] = await db
                .insert(usersTable)
                .values({
                    name: input.name,
                    username: input.username,
                    hashedPassword: await hash(input.password),
                })
                .returning();
            if (!newUser) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            }

            const session = await lucia.createSession(newUser!.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            ctx.res.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }),

    login: publicProcedure
        .input(
            z.object({
                username: z.string(),
                password: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [user] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.username, input.username));
            if (!user) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            if (!(await verify(user.hashedPassword, input.password))) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const session = await lucia.createSession(user.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            ctx.res.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }),

    logout: protectedProcedure.mutation(async ({ ctx, input }) => {
        await lucia.invalidateSession(ctx.session.id);
        const sessionCookie = lucia.createBlankSessionCookie();
        ctx.res.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }),

    getSelf: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.session.userId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        const [user] = await db
            .select({ id: usersTable.id, name: usersTable.name, username: usersTable.username })
            .from(usersTable)
            .where(eq(usersTable.id, ctx.session.userId));
        if (!user) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        return user;
    }),

    isRegistrationOpen: publicProcedure.query(async () => {
        return env.REGISTRATION_OPEN;
    }),
});
