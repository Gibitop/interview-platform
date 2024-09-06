import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type { C2SEvent } from '~insider/eventNames';

export const useUploadFile = (socket: Socket | null) => {
    const uploadFile = useCallback(
        (file: File) => {
            if (!socket) return;

            socket.emit('uploadFile' satisfies C2SEvent, file.name, file);
        },
        [socket],
    );

    return { uploadFile };
};
