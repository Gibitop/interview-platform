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
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { usersRoomsTable } from '../../db/tables/usersRoomsTable';
import { TRPCError } from '@trpc/server';
import { ROOM_TYPES } from '../../common/roomTypes';
import { createContainer, deleteContainer, isContainerActive } from '../../common/roomContainers';
import { deleteRecording, getRecording, getRecordingsRoomsList, saveRecording } from '../../common/recordings';
import { humanIdToUuid, uuidToHumanId } from '../../common/uuid';
import { generateInsiderToken } from '../../common/tokens';

export const roomsRouter = t.router({
    getMyRooms: protectedProcedure
        .input(
            z.object({
                pagination: zRequestPagination,
            }),
        )
        .query(async ({ ctx, input }) => {
            const where = and(
                eq(usersRoomsTable.userId, ctx.user.id),
                isNull(roomsTable.recordingPath),
            );

            const [rooms, totalRes] = await Promise.all([
                db
                    .select({
                        id: roomsTable.id,
                        name: roomsTable.name,
                        type: roomsTable.type,
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

            const roomsWithIsActive = await Promise.all(
                rooms.map(async room => ({
                    ...room,
                    isActive: await isContainerActive(room.id),
                })),
            );

            return {
                rooms: roomsWithIsActive,
                pagination: makeResponsePagination(input.pagination, total),
            };
        }),

    getMyRecordings: protectedProcedure
        .input(
            z.object({
                pagination: zRequestPagination,
            }),
        )
        .query(async ({ ctx, input }) => {
            const allRecordings = await getRecordingsRoomsList();
            const where = and(
                eq(usersRoomsTable.userId, ctx.user.id),
                inArray(roomsTable.id, allRecordings.map(humanIdToUuid)),
            );

            const [recordings, totalRes] = await Promise.all([
                db
                    .select({
                        id: roomsTable.id,
                        name: roomsTable.name,
                        type: roomsTable.type,
                        createdAt: roomsTable.createdAt,
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
                recordings,
                pagination: makeResponsePagination(input.pagination, total),
            };
        }),

    getRecording: protectedProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const [membership] = await db
                .select()
                .from(usersRoomsTable)
                .where(
                    and(
                        eq(usersRoomsTable.userId, ctx.user.id),
                        eq(usersRoomsTable.roomId, input.roomId),
                    ),
                );

            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return getRecording(input.roomId);
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
                const [room] = await tx
                    .insert(roomsTable)
                    .values({
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

                await createContainer(room);

                return room;
            });

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

            return generateInsiderToken(uuidToHumanId(input.roomId));
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
                        eq(usersRoomsTable.roomId, input.roomId),
                    ),
                );
            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            await saveRecording(input.roomId);
            await deleteContainer(input.roomId);
        }),

    delete: protectedProcedure
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
                        eq(usersRoomsTable.roomId, input.roomId),
                    ),
                );

            if (!membership) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            await deleteContainer(input.roomId);
            await deleteRecording(input.roomId);
            await db.delete(roomsTable).where(eq(roomsTable.id, input.roomId));
        }),

    roomExists: publicProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ input }) => {
            if (!(await isContainerActive(input.roomId))) {
                return false;
            }

            const [room] = await db
                .select()
                .from(roomsTable)
                .where(and(eq(roomsTable.id, input.roomId)))
                .catch(() => [null]);

            if (!room) {
                return false;
            }

            return true;
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
