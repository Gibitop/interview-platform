import { authRouter } from './routes/authRouter';
import { roomsRouter } from './routes/roomsRouter';
import { t } from './utils';

export const appRouter = t.router({
    rooms: roomsRouter,
    auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
