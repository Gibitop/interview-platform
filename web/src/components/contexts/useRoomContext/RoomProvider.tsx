import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '~/lib/trpc';
import { useRoomStore } from '~/stores/room';
import { roomContext, TRoomContextProviderProps } from '.';
import { useActiveFileContent } from './useActiveFileContent';
import { useActiveFilePath } from './useActiveFilePath';
import { useCandidateCopy } from './useCandidateCopy';
import { useRoomUsers } from './useRoomUsers';
import { useTerminal } from './useTerminal';
import { useUploadFile } from './useUploadFile';

export const RoomProvider = ({ children }: TRoomContextProviderProps) => {
    const roomStore = useRoomStore(data => data);
    const { data: selfUser } = trpc.auth.getSelf.useQuery();

    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!roomStore) return;
        if (roomStore.role !== 'candidate' && !selfUser) return;

        const sock = io(`${location.protocol.replace('http', 'ws')}//${location.host}`, {
            path: `/insider/${roomStore.roomId}/ws/socket.io`,
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
    }, [roomStore, selfUser]);

    const { changeMyUser, users } = useRoomUsers(
        socket,
        roomStore?.role === 'candidate' ? roomStore?.name : selfUser!.name,
        roomStore?.role,
    );

    const { activeFilePath, availableFiles, changeActiveFilePath } = useActiveFilePath(socket);
    const { activeFileContent, getActiveFileContent, updateActiveFileContent } =
        useActiveFileContent(socket, roomStore?.role);

    const { reportCopy } = useCandidateCopy(socket, users, roomStore?.role);

    const { addTerminalOutputListener, removeTerminalOutputListener, writeToTerminal } =
        useTerminal(socket, roomStore?.role);

    const { uploadFile } = useUploadFile(socket);

    useEffect(() => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    if (!socket?.connected) {
        return <div>Connecting...</div>;
    }

    return (
        <roomContext.Provider
            value={{
                myId: socket?.id ?? '',
                users,
                changeMyUser,
                reportCopy,
                activeFilePath,
                availableFiles,
                uploadFile,
                changeActiveFilePath,
                activeFileContent,
                getActiveFileContent,
                updateActiveFileContent,
                writeToTerminal,
                addTerminalOutputListener,
                removeTerminalOutputListener,
            }}
        >
            {children}
        </roomContext.Provider>
    );
};
