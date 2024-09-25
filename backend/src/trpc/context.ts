import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { lucia } from '../common/lucia';

export async function createContext({ req, res }: CreateFastifyContextOptions) {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
    if (!sessionId) {
        return {
            req,
            res,
            user: null,
            session: null,
        };
    }
    const { user, session } = await lucia.validateSession(sessionId);

    return { req, res, user, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
