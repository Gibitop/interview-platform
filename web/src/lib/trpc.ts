import SuperJSON from '~/lib/super-json';
import {
    createTRPCClient,
    createTRPCReact,
    httpBatchLink,
    type CreateTRPCClientOptions,
    type inferReactQueryProcedureOptions,
} from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from '~backend/trpc/router';

export const trpcOptions: CreateTRPCClientOptions<AppRouter> = {
    links: [
        httpBatchLink({
            url: '/api/trpc',
            transformer: SuperJSON,
        }),
    ],
};
export const trpc = createTRPCReact<AppRouter>();

/**
 * Warning: vanilla client doesn't affect react query cache.
 * Use this if the cache is irrelevant or don't forget to update
 * the cache by hand
 */
export const trpcVanilla = createTRPCClient<AppRouter>(trpcOptions);

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
