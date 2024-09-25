import { trpc } from '~/lib/trpc';

export const useAuthState = () => {
    const { error, isLoading } = trpc.auth.getSelf.useQuery(undefined, { retry: 0 });
    if (isLoading) {
        return 'loading';
    }
    if (error) {
        return 'logged-out';
    }
    return 'logged-in';
};
