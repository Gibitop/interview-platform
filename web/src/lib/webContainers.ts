import { WebContainer } from '@webcontainer/api';

let webContainerPromise: Promise<WebContainer> | null;

export const getWebContainer = async () => {
    if (!webContainerPromise) {
        console.log('Booting web container');
        webContainerPromise = WebContainer.boot({ workdirName: 'interview' });
        console.log('Booted web container');
    }
    return await webContainerPromise;
};

export const teardownWebContainer = () => {
    webContainerPromise?.then(instance => instance.teardown());
    webContainerPromise = null;
};
