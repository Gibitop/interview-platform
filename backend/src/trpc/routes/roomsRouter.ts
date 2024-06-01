import { z } from 'zod';
import { protectedProcedure, publicProcedure, t } from '../utils';
import {
    getOffset,
    makeResponsePagination,
    PER_PAGE_DEFAULT,
    zRequestPagination,
} from '../../common/pagination';
import { db } from '../../db/index';
import { roomsTable } from '../../db/tables/roomsTable';
import { and, count, desc, eq } from 'drizzle-orm';
import { usersRoomsTable } from '../../db/tables/usersRoomsTable';
import { TRPCError } from '@trpc/server';
import { ROOM_TYPES } from '../../common/roomTypes';
import { createContainer, deleteContainer } from '../../common/dockerode';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import pick from 'lodash/pick';

const START_PORT = 4000;

export const roomsRouter = t.router({
    getMy: protectedProcedure
        .input(
            z.object({
                pagination: zRequestPagination,
                filters: z
                    .object({
                        isActive: z.boolean().nullish(),
                    })
                    .nullish(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const where = and(
                eq(usersRoomsTable.userId, ctx.user.id),

                // Double equals is intentional to compare with both null and undefined
                input.filters?.isActive == null
                    ? undefined
                    : eq(roomsTable.isActive, input.filters.isActive),
            );

            const [rooms, totalRes] = await Promise.all([
                db
                    .select({
                        id: roomsTable.id,
                        name: roomsTable.name,
                        type: roomsTable.type,
                        isActive: roomsTable.isActive,
                        createdAt: roomsTable.createdAt,
                        isStealthy: usersRoomsTable.isStealthy,
                    })
                    .from(roomsTable)
                    .innerJoin(usersRoomsTable, eq(roomsTable.id, usersRoomsTable.roomId))
                    .where(where)
                    .orderBy(desc(roomsTable.createdAt))
                    .limit(input.pagination.perPage ?? PER_PAGE_DEFAULT)
                    .offset(getOffset(input.pagination)),

                db
                    .select({ count: count() })
                    .from(roomsTable)
                    .innerJoin(usersRoomsTable, eq(roomsTable.id, usersRoomsTable.roomId))
                    .where(where),
            ]);

            const total = totalRes[0]?.count ?? 0;

            return {
                rooms,
                pagination: makeResponsePagination(input.pagination, total),
            };
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                type: z.enum(ROOM_TYPES),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const room = await db.transaction(async tx => {
                const rooms = await tx
                    .select({
                        insiderPort: roomsTable.insiderPort,
                        wsPort: roomsTable.wsPort,
                        httpPort: roomsTable.httpPort,
                    })
                    .from(roomsTable)
                    .where(eq(roomsTable.isActive, true));

                const portsArr = [];
                for (const room of rooms) {
                    portsArr.push(room.insiderPort, room.wsPort, room.httpPort);
                }
                portsArr.sort((a, b) => a - b);

                let insiderPort = START_PORT;
                let wsPort = START_PORT + 1;
                let httpPort = START_PORT + 2;

                for (let i = 0; i < portsArr.length; i += 3) {
                    if (insiderPort === portsArr[i]) {
                        insiderPort += 3;
                        wsPort += 3;
                        httpPort += 3;
                    } else {
                        break;
                    }
                }

                const [room] = await tx
                    .insert(roomsTable)
                    .values({
                        insiderPort,
                        wsPort,
                        httpPort,
                        type: input.type,
                        name: input.name,
                    })
                    .returning();
                if (!room) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

                await tx.insert(usersRoomsTable).values({
                    isStealthy: false,
                    roomId: room.id,
                    userId: ctx.user.id,
                });

                return room;
            });

            await createContainer(
                room.id,
                input.type,
                room.insiderPort,
                room.wsPort,
                room.httpPort,
            );

            return room;
        }),

    join: protectedProcedure
        .input(
            z.object({
                roomId: z.string().uuid(),
                isStealthy: z.boolean(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await db
                .insert(usersRoomsTable)
                .values({ ...input, userId: ctx.user.id })
                .onConflictDoUpdate({
                    target: [usersRoomsTable.roomId, usersRoomsTable.userId],
                    set: { isStealthy: input.isStealthy },
                });
        }),

    getHostJwt: protectedProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const [membership] = await db
                .select()
                .from(usersRoomsTable)
                .where(
                    and(
                        eq(usersRoomsTable.roomId, input.roomId),
                        eq(usersRoomsTable.userId, ctx.user.id),
                    ),
                );
            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            const token = jwt.sign(
                { roomId: input.roomId },
                await readFile('./jwt-private-key.pem', 'utf-8'),
                {
                    algorithm: 'RS256',
                    expiresIn: '24h',
                },
            );

            return token;
        }),

    leave: protectedProcedure
        .input(
            z.object({
                roomId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(usersRoomsTable)
                .where(
                    and(
                        eq(usersRoomsTable.userId, ctx.user.id),
                        eq(usersRoomsTable.roomId, ctx.user.id),
                    ),
                );
        }),

    stop: protectedProcedure
        .input(
            z.object({
                roomId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [membership] = await db
                .select()
                .from(usersRoomsTable)
                .where(
                    and(
                        eq(usersRoomsTable.userId, ctx.user.id),
                        eq(usersRoomsTable.roomId, ctx.user.id),
                    ),
                );
            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            deleteContainer(input.roomId);

            await db
                .update(roomsTable)
                .set({ isActive: false })
                .where(eq(roomsTable.id, input.roomId));
        }),

    delete: protectedProcedure
        .input(
            z.object({
                roomId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // TODO: Stop the container, if running
            // TODO: Remove recording data

            await db.delete(roomsTable).where(eq(roomsTable.id, input.roomId));
        }),

    getPublicInfo: publicProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ input }) => {
            const [room] = await db
                .select()
                .from(roomsTable)
                .where(and(eq(roomsTable.id, input.roomId), eq(roomsTable.isActive, true)));
            if (!room) throw new TRPCError({ code: 'NOT_FOUND' });

            const out = pick(room, 'wsPort', 'httpPort', 'type');

            return out;
        }),

    getHostInfo: protectedProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const [room] = await db
                .select()
                .from(roomsTable)
                .where(eq(roomsTable.id, input.roomId));
            if (!room) throw new TRPCError({ code: 'NOT_FOUND' });

            return room;
        }),
});
