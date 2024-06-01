import { trpc } from '~/lib/trpc';

export const useInvalidateProtected = () => {
    const trpcUtils = trpc.useUtils();
    return () => {
        trpcUtils.auth.getSelf.invalidate();
        trpcUtils.rooms.invalidate();
    };
};
