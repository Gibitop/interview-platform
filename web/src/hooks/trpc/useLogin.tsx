import { trpc } from '~/lib/trpc';
import { useInvalidateProtected } from './useInvalidateProtected';

export const useLogin = (options?: Parameters<typeof trpc.auth.login.useMutation>[0]) => {
    const invalidateProtected = useInvalidateProtected();

    return trpc.auth.login.useMutation({
        ...options,
        onSuccess: (...args) => {
            options?.onSuccess?.(...args);
            invalidateProtected();
        },
    });
};
