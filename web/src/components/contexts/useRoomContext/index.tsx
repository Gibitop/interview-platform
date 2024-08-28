import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '~/lib/trpc';
import { useRoomStore } from '~/stores/room';

import { StrApi } from 'json-joy/lib/json-crdt';
import { useRoomUsers } from './useRoomUsers';
import { useActiveFileContent } from './useActiveFileContent';
import { useCandidateCopy } from './useCandidateCopy';
import { useTerminal } from './useTerminal';
import type { MyUserChangeRequest, User } from '~/../../../insider/src/controllers/users';

export type TRoomContextProviderProps = {
    wsPort: number;
    children: React.ReactNode;
};

type TRoomContext = {
    myId: string;
    users: User[];
    getActiveFileContent: () => string;
    changeMyUser: (data: MyUserChangeRequest) => void;
    reportCopy: () => void;
    updateActiveFileContent: (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => void;
    writeToTerminal: (data: string) => void;
    addTerminalOutputListener: (cb: (data: string) => void) => void;
    removeTerminalOutputListener: (cb: (data: string) => void) => void;
};

const roomContext = createContext<TRoomContext | null>(null);

export const RoomProvider = ({ wsPort, children }: TRoomContextProviderProps) => {
    const roomStore = useRoomStore(data => data);
    const { data: selfUser } = trpc.auth.getSelf.useQuery();

    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!roomStore) return;
        if (roomStore.role !== 'candidate' && !selfUser) return;

        const sock = io(`ws://${location.hostname}:${wsPort}`, {
            transports: ['websocket'],
            auth: {
                token: roomStore.role === 'host' ? roomStore.token : undefined,
                spectatorMode: roomStore.role === 'host' && roomStore.isSpectator,
            },
            autoConnect: false,
        });

        setSocket(sock);

        return () => {
            sock.offAny();
            sock.disconnect();
            setSocket(null);
        };
    }, [roomStore, selfUser, wsPort]);

    const { changeMyUser, users } = useRoomUsers(
        socket,
        roomStore?.role === 'candidate' ? roomStore?.name : selfUser!.name,
        roomStore?.role,
    );

    const { getActiveFileContent, updateActiveFileContent } = useActiveFileContent(socket);

    const { reportCopy } = useCandidateCopy(socket, users, roomStore?.role);

    const { addTerminalOutputListener, removeTerminalOutputListener, writeToTerminal } =
        useTerminal(socket);

    useEffect(() => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    const providerValue = useMemo(
        () => ({
            users,
            getActiveFileContent,
            changeMyUser,
            reportCopy,
            updateActiveFileContent,
            writeToTerminal,
            myId: socket?.id ?? '',
            addTerminalOutputListener,
            removeTerminalOutputListener,
        }),
        [
            users,
            getActiveFileContent,
            changeMyUser,
            reportCopy,
            updateActiveFileContent,
            writeToTerminal,
            socket?.id,
            addTerminalOutputListener,
            removeTerminalOutputListener,
        ],
    );

    return <roomContext.Provider value={providerValue}>{children}</roomContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRoomContext = () => useContext(roomContext);
