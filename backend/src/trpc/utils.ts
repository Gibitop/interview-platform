import SuperJSON from 'superjson';
import { initTRPC, TRPCError } from '@trpc/server';
import { createContext } from './context';
import { lucia } from '../common/lucia';

export const t = initTRPC.context<typeof createContext>().create({
    transformer: SuperJSON
});

export const publicProcedure = t.procedure.use(({ ctx, next }) => {
    let sessionCookie = ctx.session
        ? lucia.createSessionCookie(ctx.session.id)
        : lucia.createBlankSessionCookie();
    ctx.res.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return next();
});

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
    if (!ctx.session) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            user: ctx.user!,
            session: ctx.session!,
        },
    });
});
