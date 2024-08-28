import { readFileSync, writeFileSync } from 'fs';
import { Model, nodes, Patch } from 'json-joy/lib/json-crdt';
import { getActiveFilePath } from './activeFilePath';
import type { Server, Socket } from 'socket.io';
import type { C2SEvent, S2CEvent } from '../eventNames';

const activeFileContentCRDT = Model.create<nodes.str>();
activeFileContentCRDT.api.root(readFileSync(getActiveFilePath(), 'utf-8') || '');
const activeFileContentStr = activeFileContentCRDT.api.str('');

const applyBinaryPatch = (patch: Uint8Array) => {
    activeFileContentCRDT.applyPatch(Patch.fromBinary(patch));
    writeFileSync(getActiveFilePath(), activeFileContentStr.view());
};

export const replace = (text: string, index = 0, length = Number.MAX_VALUE) => {
    activeFileContentStr.del(index, length);
    activeFileContentStr.ins(index, text);
    writeFileSync(getActiveFilePath(), activeFileContentStr.view());
};

export const getBinaryModel = () => activeFileContentCRDT.toBinary();

export const broadcastPendingPatch = (io: Server) => {
    const patch = activeFileContentCRDT.api.flush();
    io.emit('active-file-content-patched' satisfies S2CEvent, patch.toBinary());
}

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        socket.on('patch-active-file-content' satisfies C2SEvent, (data: Uint8Array) => {
            try {
                applyBinaryPatch(data);
                io.emit('active-file-content-patched' satisfies S2CEvent, data);
            } catch (e) {
                console.log(e)
            }
        });

        socket.on('request-active-file-content' satisfies C2SEvent, () => {
            socket.emit('active-file-content-rewritten' satisfies S2CEvent, getBinaryModel());
        });
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
    };
};
