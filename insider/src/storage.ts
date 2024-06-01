import { Model, nodes, Patch } from 'json-joy/lib/json-crdt';
import { readFileSync, writeFileSync } from 'fs';

export const workDir = './wd';

// --- Active file path --- //
let activeFilePath = `${workDir}/test.txt`;
export const activeFilePathStorage = {
    set: (path: string) => (activeFilePath = path),
    get: () => activeFilePath,
};

// --- Active file content --- //
const activeFileContentCRDT = Model.create<nodes.str>();
activeFileContentCRDT.api.root(readFileSync(activeFilePath, 'utf-8') || '');
const activeFileContentStr = activeFileContentCRDT.api.str('');

export const activeFileContentStorage = {
    applyBinaryPatch: (patch: Uint8Array) => {
        activeFileContentCRDT.applyPatch(Patch.fromBinary(patch));
        writeFileSync(activeFilePath, activeFileContentStr.view());
    },
    insert: (text: string, index: number) => {
        activeFileContentStr.ins(index, text);
        writeFileSync(activeFilePath, activeFileContentStr.view());
        return activeFileContentStr.api.flush().toBinary();
    },
    delete: (index = 0, length = Number.MAX_VALUE) => {
        activeFileContentStr.del(index, length);
        writeFileSync(activeFilePath, activeFileContentStr.view());
        return activeFileContentStr.api.flush().toBinary();
    },
    replace: (text: string, index = 0, length = Number.MAX_VALUE) => {
        activeFileContentStr.del(index, length);
        activeFileContentStr.ins(index, text);
        writeFileSync(activeFilePath, activeFileContentStr.view());
        return activeFileContentStr.api.flush().toBinary();
    },
    getValue: () => activeFileContentStr.view(),
    getBinaryModel: () => activeFileContentCRDT.toBinary(),
};

// --- Awareness --- //
export type Awareness = {
    name: string;
    color: string;
    line: number;
    char: number;
    isFocused: boolean;
};

const awareness = new Map<string, Awareness>();

export const awarenessStorage = {
    set: (id: string, data: Partial<Awareness>) =>
        // TODO: Write a better join, this is prone to setting explicit undefined
        // @ts-ignore
        awareness.set(id, { ...awareness.get(id), ...data }),
    delete: (id: string) => awareness.delete(id),
    get: () => Object.fromEntries(awareness.entries()),
};
