import { trpc } from '~/lib/trpc';

export const useJoinRoom = (options?: Parameters<typeof trpc.rooms.join.useMutation>[0]) => {
    const trpcUtils = trpc.useUtils();

    return trpc.rooms.join.useMutation({
        ...options,
        onSuccess: (...args) => {
            options?.onSuccess?.(...args);
            trpcUtils.rooms.getMyRooms.invalidate();
        },
    });
};
