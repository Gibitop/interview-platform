import { createContext, useContext } from 'react';

import { StrApi } from 'json-joy/lib/json-crdt';
import type { ChangeMyUserRequest, User } from '~insider/types/users';

export type TRoomContextProviderProps = {
    children: React.ReactNode;
};

export type TRoomContext = {
    myId: string;
    users: User[];
    changeMyUser: (
        data: ChangeMyUserRequest | ((user: ChangeMyUserRequest) => ChangeMyUserRequest),
    ) => void;
    reportCopy: () => void;
    activeFilePath: string;
    availableFiles: string[];
    uploadFile: (file: File) => void;
    changeActiveFilePath: (newPath: string) => void;
    activeFileContent: string;
    getActiveFileContent: () => string;
    updateActiveFileContent: (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => void;
    notesContent: string;
    getNotesContent: () => string;
    updateNotesContent: (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => void;
    writeToTerminal: (data: string) => void;
    addTerminalOutputListener: (cb: (data: string) => void) => void;
    removeTerminalOutputListener: (cb: (data: string) => void) => void;
};

export const roomContext = createContext<TRoomContext | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useRoomContext = () => useContext(roomContext);
