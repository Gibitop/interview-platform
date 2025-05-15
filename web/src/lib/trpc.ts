/* eslint-disable @typescript-eslint/ban-ts-comment */
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
// @ts-ignore - For some reason, TS errors when comparing frontend router type with backend router type. But this works including the types.
export const trpc = createTRPCReact<AppRouter>();

/**
 * Warning: vanilla client doesn't affect react query cache.
 * Use this if the cache is irrelevant or don't forget to update
 * the cache by hand
 */
// @ts-ignore - For some reason, TS errors when comparing frontend router type with backend router type. But this works including the types.
export const trpcVanilla = createTRPCClient<AppRouter>(trpcOptions);

// @ts-ignore - For some reason, TS errors when comparing frontend router type with backend router type. But this works including the types.
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
// @ts-ignore - For some reason, TS errors when comparing frontend router type with backend router type. But this works including the types.
export type RouterInputs = inferRouterInputs<AppRouter>;
// @ts-ignore - For some reason, TS errors when comparing frontend router type with backend router type. But this works including the types.
export type RouterOutputs = inferRouterOutputs<AppRouter>;
