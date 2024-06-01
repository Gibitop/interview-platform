import debounce from 'lodash/debounce';
import { useCallback, useEffect, useState } from 'react';

// Dangling comma is needed, so that the parser does not confuse the generic with a JSX tag
// eslint-disable-next-line @typescript-eslint/comma-dangle
export const useDebouncedValue = <T,>(value: T, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    // This rule does can't parse dependecies of the debounce function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetDebouncedValue = useCallback(debounce(setDebouncedValue, delay), [delay]);

    useEffect(() => {
        debouncedSetDebouncedValue(value);
    }, [debouncedSetDebouncedValue, value]);

    return debouncedValue;
};
