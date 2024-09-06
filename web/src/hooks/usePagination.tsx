import { useEffect, useMemo, useState } from 'react';
import omit from 'lodash/omit';
import type { TResponsePagination } from '~backend/common/pagination';

const defaultResponsePagination: TResponsePagination = {
    page: 1,
    perPage: 20,
    pages: 1,
};

export const usePagination = (initialResponsePagination?: Partial<TResponsePagination>) => {
    const [responsePagination, setResponsePagination] = useState({
        ...defaultResponsePagination,
        ...initialResponsePagination,
    });
    const requestPagination = useMemo(
        () => omit(responsePagination, 'pages'),
        [responsePagination],
    );

    const setPage = (page: number) => setResponsePagination({ ...responsePagination, page });
    const setPerPage = (perPage: number) =>
        setResponsePagination({ ...responsePagination, perPage });

    const useSetResponsePagination = (pagination?: TResponsePagination) => {
        useEffect(() => {
            if (pagination) {
                setResponsePagination(pagination);
            }
        }, [pagination]);
    };

    return {
        responsePagination,
        requestPagination,
        setResponsePagination,
        setPage,
        setPerPage,
        useSetResponsePagination,
    };
};
