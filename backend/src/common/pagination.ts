import { z } from 'zod';

export const PAGE_DEFAULT = 1;
export const PER_PAGE_DEFAULT = 20;

export const zRequestPagination = z.object({
    page: z.number().min(1).default(PAGE_DEFAULT).nullish(),
    perPage: z.number().min(1).default(PER_PAGE_DEFAULT).nullish(),
});

export const zResponsePagination = z.object({
    page: z.number().min(1).default(1),
    perPage: z.number().min(1).default(20),
    pages: z.number(),
});

export type TRequestPagination = z.infer<typeof zRequestPagination>;
export type TResponsePagination = z.infer<typeof zResponsePagination>;

export const getOffset = ({ page, perPage }: TRequestPagination) =>
    ((page ?? PAGE_DEFAULT) - 1) * (perPage ?? PER_PAGE_DEFAULT);


export const makeResponsePagination = (input: TRequestPagination, total: number) => {
    const perPage = input.perPage ?? PER_PAGE_DEFAULT;
    return {
        page: input.page ?? PAGE_DEFAULT,
        perPage,
        pages: Math.ceil(total / perPage) || 1,
    };
}