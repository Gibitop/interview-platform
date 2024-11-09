import { readFileSync, writeFileSync } from 'fs';
import { Model, nodes, Patch } from 'json-joy/lib/json-crdt/index.js';
import { addActiveFileUpdateListener, getFullActiveFilePath, getRelativeActiveFilePath, removeActiveFileUpdateListener } from './activeFilePath';
import type { Server, Socket } from 'socket.io';
import type { C2SEvent, S2CEvent } from '../eventNames';
import debounce from 'lodash/debounce.js';
import { watch } from 'fs/promises';
import { getUser } from './users';

const activeFileContentCRDT = Model.create<nodes.str>();
activeFileContentCRDT.api.root(readFileSync(getFullActiveFilePath(), 'utf-8') || '');
const activeFileContentStr = activeFileContentCRDT.api.str('');

const applyBinaryPatch = (patch: Uint8Array) => {
    activeFileContentCRDT.applyPatch(Patch.fromBinary(patch));
    writeFileSync(getFullActiveFilePath(), activeFileContentStr.view());
};

export const replace = (text: string, index = 0, length = Number.MAX_VALUE) => {
    activeFileContentStr.del(index, length);
    if (text) {
        activeFileContentStr.ins(index, text);
    }
    writeFileSync(getFullActiveFilePath(), activeFileContentStr.view());
};

export const getBinaryModel = () => activeFileContentCRDT.toBinary();

export const broadcastPendingPatch = (io: Server) => {
    const patch = activeFileContentCRDT.api.flush();
    io.emit('active-file-content-patched' satisfies S2CEvent, patch.toBinary());
}

export const broadcastActiveFileContentRewrite = (io: Server) => {
    io.emit('active-file-content-rewritten' satisfies S2CEvent, getBinaryModel());
}

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        const patchActiveFileContentListener = (data: unknown, filename: string) => {
            if (!(data instanceof Uint8Array)) return;
            if (getUser(socket.id)?.role === 'spectator') return;
            if (getUser(socket.id)?.role === 'recorder') return;

            if (filename !== getRelativeActiveFilePath()) {
                socket.emit('active-file-content-rewritten' satisfies S2CEvent, getBinaryModel());
                return;
            }

            try {
                applyBinaryPatch(data);
                io.emit('active-file-content-patched' satisfies S2CEvent, data);
            } catch (e) {
                console.log(e)
            }
        };
        socket.on('patch-active-file-content' satisfies C2SEvent, patchActiveFileContentListener);

        const requestActiveFileContentListener = () => {
            socket.emit('active-file-content-rewritten' satisfies S2CEvent, getBinaryModel());
        };
        socket.on('request-active-file-content' satisfies C2SEvent, requestActiveFileContentListener);

        socket.once('disconnect', () => {
            socket.off('patch-active-file-content' satisfies C2SEvent, patchActiveFileContentListener);
            socket.off('request-active-file-content' satisfies C2SEvent, requestActiveFileContentListener);
        });
    };

    let activeFileWatchAbortController = new AbortController();

    const watchActiveFile = async () => {
        const handleActiveFileChange = debounce(async () => {
            const newContent = readFileSync(getFullActiveFilePath(), 'utf-8');
            if (newContent === activeFileContentStr.view()) return;

            replace(newContent);
            broadcastPendingPatch(io);
        }, 100);

        try {
            for await (const event of watch(getFullActiveFilePath(), { recursive: true, signal: activeFileWatchAbortController.signal })) {
                if (event.eventType !== 'change') continue;
                handleActiveFileChange();
            }
        } catch (e) { }
    };

    watchActiveFile();

    const changeActiveFilePathListener = () => {
        try {
            activeFileWatchAbortController.abort();
        } catch (e) { }
        activeFileWatchAbortController = new AbortController();
        watchActiveFile();
    };
    addActiveFileUpdateListener(changeActiveFilePathListener);

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
        removeActiveFileUpdateListener(changeActiveFilePathListener);
        activeFileWatchAbortController.abort();
    };
};
