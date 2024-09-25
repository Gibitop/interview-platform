import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from '../ui/pagination';
import { cn } from '~/utils/shadcn';

export type TSimplePaginationProps = {
    page: number;
    pages: number;
    setPage: (page: number) => void;
    spread?: number;
    className?: string;
};

export const SimplePagination: React.FC<TSimplePaginationProps> = ({
    page,
    pages,
    setPage,
    spread = 2,
    className,
}) => {
    const pagesToShow = [page];
    let boxes = 2 * spread;
    while (boxes && (pagesToShow[0] > 1 || pagesToShow[pagesToShow.length - 1] < pages)) {
        if (pagesToShow[0] > 1) {
            pagesToShow.unshift(pagesToShow[0] - 1);
            boxes--;
        }
        if (pagesToShow[pagesToShow.length - 1] < pages) {
            pagesToShow.push(pagesToShow[pagesToShow.length - 1] + 1);
            boxes--;
        }
    }

    return (
        <Pagination className={cn('select-none', className)}>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        className={cn(page > 1 && 'cursor-pointer', page <= 1 && 'opacity-50')}
                        onClick={() => setPage(Math.max(page - 1, 1))}
                    />
                </PaginationItem>

                {pagesToShow.map(p => (
                    <PaginationItem key={p}>
                        <PaginationLink
                            isActive={p === page}
                            className={p === page ? 'cursor-default' : 'cursor-pointer'}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        className={cn(
                            page < pages && 'cursor-pointer',
                            page >= pages && 'opacity-50',
                        )}
                        onClick={() => setPage(Math.min(page + 1, pages))}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
