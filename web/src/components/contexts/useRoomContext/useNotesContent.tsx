import { Model, nodes, Patch, StrApi, StrNode } from 'json-joy/lib/json-crdt';
import { useRef, useCallback, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { C2SEvent, S2CEvent } from '~insider/eventNames';
import type { Role } from '~insider/types/users';

const makeNotesContentCRDT = () => {
    const notesContentCRDT = Model.create<nodes.str>();
    notesContentCRDT.api.root('<p></p>');
    return notesContentCRDT;
};

export const useNotesContent = (socket: Socket | null, role?: Role) => {
    const notesContentRef = useRef(makeNotesContentCRDT());

    const getNotesContent = useCallback(
        () => notesContentRef.current?.api.str('').view() ?? '',
        [],
    );
    const [notesContent, setNotesContent] = useState(getNotesContent);
    const refreshNotesContent = useCallback(
        () => setNotesContent(getNotesContent()),
        [getNotesContent],
    );

    const updateNotesContent = useCallback(
        (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => {
            if (!notesContentRef.current) return;
            if (role !== 'host') return;

            const str = notesContentRef.current.api.str('');
            cb(str.ins.bind(str), str.del.bind(str));

            console.log('NEW STR:', str.view());

            if (!socket || !socket.connected) return;
            const patch = notesContentRef.current.api.flush();
            refreshNotesContent();
            socket.emit('patch-notes-content' satisfies C2SEvent, patch.toBinary());
        },
        [socket, role, refreshNotesContent],
    );

    useEffect(() => {
        if (!socket) return;

        const connectHandler = () => {
            socket.emit('request-notes-content' satisfies C2SEvent);
        };
        socket.on('connect', connectHandler);

        const rewriteHandler = (data: ArrayBuffer) => {
            notesContentRef.current = Model.fromBinary(new Uint8Array(data)) as unknown as Model<
                StrNode<string>
            >;
            refreshNotesContent();
        };
        socket.on('notes-content-rewritten' satisfies S2CEvent, rewriteHandler);

        const patchHandler = (data: ArrayBuffer) => {
            if (!notesContentRef.current) {
                socket.emit('request-notes-content' satisfies C2SEvent);
                return;
            }
            notesContentRef.current.applyPatch(Patch.fromBinary(new Uint8Array(data)));
            refreshNotesContent();
        };
        socket.on('notes-content-patched' satisfies S2CEvent, patchHandler);

        return () => {
            socket.off('connect', connectHandler);
            socket.off('notes-content-rewritten' satisfies S2CEvent, rewriteHandler);
            socket.off('notes-content-patched' satisfies S2CEvent, patchHandler);
        };
    }, [getNotesContent, refreshNotesContent, socket]);

    const resetState = useCallback(() => {
        notesContentRef.current = makeNotesContentCRDT();
        setNotesContent('');
    }, []);

    return { getNotesContent, updateNotesContent, notesContent, resetState };
};
