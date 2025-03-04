import type { Server, Socket } from "socket.io";
import { Model, nodes, Patch } from 'json-joy/lib/json-crdt/index.js';
import type { C2SEvent, S2CEvent } from "../eventNames";
import { getUser } from "./users";

const notesContentCRDT = Model.create<nodes.str>();
// TODO: Add notes recovery
notesContentCRDT.api.root('');
const activeFileContentStr = notesContentCRDT.api.str('');


const applyBinaryPatch = (patch: Uint8Array) => {
    notesContentCRDT.applyPatch(Patch.fromBinary(patch));
    // TODO: Add notes recovery
    console.log('TODO: save notes to file\n', activeFileContentStr.view());
};

export const getBinaryModel = () => notesContentCRDT.toBinary();

export const broadcastPendingPatch = (io: Server) => {
    const patch = notesContentCRDT.api.flush();
    io.emit('notes-content-patched' satisfies S2CEvent, patch.toBinary());
}

export const broadcastActiveFileContentRewrite = (io: Server) => {
    io.emit('notes-content-rewritten' satisfies S2CEvent, getBinaryModel());
}

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        const patchActiveFileContentListener = (data: unknown, filename: string) => {
            if (!(data instanceof Uint8Array)) return;
            if (getUser(socket.id)?.role !== 'host') return;

            try {
                applyBinaryPatch(data);
                io.emit('notes-content-patched' satisfies S2CEvent, data);
            } catch (e) {
                console.error(e)
            }
        };
        socket.on('patch-notes-content' satisfies C2SEvent, patchActiveFileContentListener);

        const requestActiveFileContentListener = () => {
            socket.emit('notes-content-rewritten' satisfies S2CEvent, getBinaryModel());
        };
        socket.on('request-notes-content' satisfies C2SEvent, requestActiveFileContentListener);

        socket.once('disconnect', () => {
            socket.off('patch-notes-content' satisfies C2SEvent, patchActiveFileContentListener);
            socket.off('request-notes-content' satisfies C2SEvent, requestActiveFileContentListener);
        });
    };

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
    };
};
