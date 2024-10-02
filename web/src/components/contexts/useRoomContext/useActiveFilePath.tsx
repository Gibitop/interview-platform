import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { C2SEvent, S2CEvent } from '~insider/eventNames';

export const useActiveFilePath = (socket: Socket | null) => {
    const [activeFilePath, setActiveFilePath] = useState('');
    const [availableFiles, setAvailableFiles] = useState<string[]>([]);

    const changeActiveFilePath = useCallback(
        (newPath: string) => {
            if (!socket || !newPath) return;
            socket.emit('change-active-file-path' satisfies C2SEvent, newPath);
            setActiveFilePath(newPath);
        },
        [socket],
    );

    useEffect(() => {
        if (!socket) return;

        const connectListener = () => {
            socket.emit('request-active-file-path' satisfies C2SEvent);
            socket.emit('request-available-files' satisfies C2SEvent);
        };
        socket.on('connect', connectListener);

        const activeFilePathChangedListener = (newPath: string) => {
            setActiveFilePath(newPath);
        };
        socket.on('active-file-path-changed' satisfies S2CEvent, activeFilePathChangedListener);

        const availableFilesChangedListener = (newAvailableFiles: string[]) => {
            setAvailableFiles(newAvailableFiles);
        };
        socket.on('available-files-changed' satisfies S2CEvent, availableFilesChangedListener);

        return () => {
            socket.off('connect', connectListener);
            socket.off(
                'active-file-path-changed' satisfies S2CEvent,
                activeFilePathChangedListener,
            );
            socket.off('available-files-changed' satisfies S2CEvent, availableFilesChangedListener);
        };
    }, [socket]);

    const resetState = useCallback(() => {
        setActiveFilePath('');
        setAvailableFiles([]);
    }, []);

    return { activeFilePath, availableFiles, changeActiveFilePath, resetState };
};
