import { Model, Patch, StrApi, StrNode } from 'json-joy/lib/json-crdt';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '~/stores/room';
import type { C2SEvent, S2CEvent } from '~insider/eventNames';

export const useActiveFileContent = (socket: Socket | null) => {
    const roomStore = useRoomStore();

    const activeFileRef = useRef<Model<StrNode<string>> | null>(null);

    const getActiveFileContent = useCallback(
        () => activeFileRef.current?.api.str('').view() ?? '',
        [],
    );
    const [activeFileContent, setActiveFileContent] = useState(getActiveFileContent);
    const refreshActiveFileContent = useCallback(
        () => setActiveFileContent(getActiveFileContent()),
        [getActiveFileContent],
    );

    const isSpectator = (roomStore?.role === 'candidate' ? false : roomStore?.isSpectator) ?? false;
    const updateActiveFileContent = useCallback(
        (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => {
            if (!activeFileRef.current || !socket || !socket.connected) return;
            if (roomStore?.role === 'host' && isSpectator) return;

            const str = activeFileRef.current.api.str('');
            cb(str.ins.bind(str), str.del.bind(str));

            const patch = activeFileRef.current.api.flush();
            refreshActiveFileContent();
            socket.emit('patch-active-file-content' satisfies C2SEvent, patch.toBinary());
        },
        [socket, roomStore?.role, isSpectator, refreshActiveFileContent],
    );

    useEffect(() => {
        if (!socket) return;

        const connectHandler = () => {
            socket.emit('request-active-file-content' satisfies C2SEvent);
        };
        socket.on('connect', connectHandler);

        const rewriteHandler = (data: ArrayBuffer) => {
            activeFileRef.current = Model.fromBinary(new Uint8Array(data)) as unknown as Model<
                StrNode<string>
            >;
            refreshActiveFileContent();
        };
        socket.on('active-file-content-rewritten' satisfies S2CEvent, rewriteHandler);

        const patchHandler = (data: ArrayBuffer) => {
            if (!activeFileRef.current) {
                socket.emit('request-active-file-content' satisfies C2SEvent);
                return;
            }
            activeFileRef.current.applyPatch(Patch.fromBinary(new Uint8Array(data)));
            refreshActiveFileContent();
        };
        socket.on('active-file-content-patched' satisfies S2CEvent, patchHandler);

        return () => {
            socket.off('connect', connectHandler);
            socket.off('active-file-content-rewritten' satisfies S2CEvent, rewriteHandler);
            socket.off('active-file-content-patched' satisfies S2CEvent, patchHandler);
        };
    }, [getActiveFileContent, refreshActiveFileContent, socket]);

    return { getActiveFileContent, updateActiveFileContent, activeFileContent };
};
