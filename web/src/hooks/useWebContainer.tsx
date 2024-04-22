import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';
import { getWebContainer } from '../lib/webContainers';

export const useWebContainer = (disable = false) => {
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);

    useEffect(() => {
        if (disable) return;
        getWebContainer().then(setWebContainer);
    }, [disable]);

    return webContainer;
};
