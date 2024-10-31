import type { Server, Socket } from 'socket.io';
import { stat, readdir, watch } from 'fs/promises';
import { getUser } from './users';
import {
    broadcastActiveFileContentRewrite,
    replace as replaceActiveFileContent,
} from './activeFileContent';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { env } from '../env';
import debounce from 'lodash/debounce.js';
import type { C2SEvent, S2CEvent } from '../eventNames';

let relativeActiveFilePath = env.START_ACTIVE_FILE_NAME;
let fullActiveFilePath = `${env.WORKING_DIRECTORY}/${relativeActiveFilePath}`;
const activeFileUpdateListeners = new Set<() => void>([]);

export const addActiveFileUpdateListener = (listener: () => void) => {
    activeFileUpdateListeners.add(listener);
}
export const removeActiveFileUpdateListener = (listener: () => void) => {
    activeFileUpdateListeners.delete(listener);
}

const changeActiveFilePath = (newRelativePath: string) => {
    relativeActiveFilePath = newRelativePath;
    fullActiveFilePath = `${env.WORKING_DIRECTORY}/${relativeActiveFilePath}`;
    activeFileUpdateListeners.forEach(listener => listener());
}

const getAvailableFilesFullPaths = async (startPath = env.WORKING_DIRECTORY) => {
    const out: string[] = [];

    const entries = await readdir(startPath);
    await Promise.all(entries
        .map(async (entry) => {
            const fullEntryPath = `${startPath}/${entry}`;
            const entryInfo = await stat(fullEntryPath);

            if (entryInfo.isFile()) {
                out.push(fullEntryPath);
            } else if (entryInfo.isDirectory()) {
                // TODO: Implement .ipignore file
                // Skip node_modules
                if (entry === 'node_modules') return;

                out.push(...await getAvailableFilesFullPaths(fullEntryPath))
            } else {
                // We don't support symlinks
            }
        })
    );

    return out;
};

const getAvailableFilesRelativePaths = async () => {
    const paths = await getAvailableFilesFullPaths();
    return paths.map(path => path.slice(env.WORKING_DIRECTORY.length + 1));
}

const fsUpdateListeners = new Set<() => void>([]);


export const getFullActiveFilePath = () => fullActiveFilePath;
export const getRelativeActiveFilePath = () => relativeActiveFilePath;

export const setup = (io: Server) => {
    const connectionListener = (socket: Socket) => {
        const changeActiveFilePathListener = (newPath: unknown) => {
            if (typeof newPath !== 'string') return;
            if (getUser(socket.id)?.role !== 'host') return;

            changeActiveFilePath(newPath);
            socket.broadcast.emit('active-file-path-changed' satisfies S2CEvent, relativeActiveFilePath);

            // Update active file content
            if (!existsSync(fullActiveFilePath)) {
                writeFileSync(fullActiveFilePath, '');
            }
            const newContent = readFileSync(fullActiveFilePath, 'utf-8');
            replaceActiveFileContent(newContent);
            broadcastActiveFileContentRewrite(io);
        }
        socket.on('change-active-file-path' satisfies C2SEvent, changeActiveFilePathListener);

        const activeFilePathRequestListener = () => {
            socket.emit('active-file-path-changed' satisfies S2CEvent, relativeActiveFilePath);
        };
        socket.on('request-active-file-path' satisfies C2SEvent, activeFilePathRequestListener);

        const availableFilesRequestListener = async () => {
            socket.emit('available-files-changed' satisfies S2CEvent, await getAvailableFilesRelativePaths());
        };
        socket.on('request-available-files' satisfies C2SEvent, availableFilesRequestListener);

        const fsUpdateListener = async () => {
            const availablePaths = await getAvailableFilesRelativePaths();
            socket.emit('available-files-changed' satisfies S2CEvent, availablePaths);

            if (availablePaths.length && !availablePaths.includes(relativeActiveFilePath)) {
                changeActiveFilePath(availablePaths[0]!);
                io.emit('active-file-path-changed' satisfies S2CEvent, relativeActiveFilePath);

                replaceActiveFileContent(readFileSync(fullActiveFilePath, 'utf-8'));
                broadcastActiveFileContentRewrite(io);
            }
        };
        fsUpdateListeners.add(fsUpdateListener);

        socket.once('disconnect', () => {
            socket.off('change-active-file-path' satisfies C2SEvent, changeActiveFilePathListener);
            socket.off('request-active-file-path' satisfies C2SEvent, activeFilePathRequestListener);
            socket.off('request-available-files' satisfies C2SEvent, availableFilesRequestListener);
            fsUpdateListeners.delete(fsUpdateListener);
        });
    };

    const fsWatchAbortController = new AbortController();

    (async () => {
        const callFsListeners = debounce(() => {
            fsUpdateListeners.forEach(listener => listener());
        }, 100);

        for await (const event of watch(env.WORKING_DIRECTORY, { recursive: true, signal: fsWatchAbortController.signal })) {
            if (event.eventType !== 'rename') continue;
            callFsListeners();
        }
    })();

    io.on('connection', connectionListener);

    return () => {
        io.off('connection', connectionListener);
        fsUpdateListeners.clear();
        fsWatchAbortController.abort();
    };
};
