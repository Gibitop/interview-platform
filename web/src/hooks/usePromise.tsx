import { useEffect, useState } from 'react';

export const usePromise = <T,>(promise?: Promise<T>, defaultLoading = true) => {
    const [value, setValue] = useState<T | undefined>(undefined);
    const [error, setError] = useState<unknown>(undefined);
    const [loading, setLoading] = useState(defaultLoading);

    useEffect(() => {
        if (!promise) return;

        promise
            .then(resolved => {
                setValue(resolved);
                setLoading(false);
                setError(undefined);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            });
    }, [promise]);

    return { value, error, loading };
};
