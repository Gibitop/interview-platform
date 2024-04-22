import { WebContainer } from '@webcontainer/api';

let webContainerPromise: Promise<WebContainer> | null;

export const getWebContainer = async () => {
    if (!webContainerPromise) {
        webContainerPromise = WebContainer.boot({ workdirName: 'interview' });
    }
    return await webContainerPromise;
};

export const teardownWebContainer = () => {
    webContainerPromise?.then(instance => instance.teardown());
    webContainerPromise = null;
};
