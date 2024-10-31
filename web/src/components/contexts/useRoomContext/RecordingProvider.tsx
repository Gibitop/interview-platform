import { useCallback } from 'react';
import type { RecordedEvent } from '~insider/types/recording';
import { roomContext } from '.';
import { useRoomUsers } from './useRoomUsers';
import { trpc } from '~/lib/trpc';
import { useActiveFilePath } from './useActiveFilePath';
import { useActiveFileContent } from './useActiveFileContent';
import { useTerminal } from './useTerminal';
import { Playback } from '~/components/Playback';
import { useMockSocket } from '~/hooks/useMockSocket';

type TRecordingContextProviderProps = {
    children: React.ReactNode;
    recording: RecordedEvent[];
};

export const RecordingProvider = ({ children, recording }: TRecordingContextProviderProps) => {
    const { data: selfUser } = trpc.auth.getSelf.useQuery();

    const { mockSocket, receiveEvent } = useMockSocket();

    const { users, resetState: resetUsers } = useRoomUsers(mockSocket, selfUser!.name, 'recorder');

    const {
        activeFilePath,
        availableFiles,
        resetState: resetActiveFilePath,
    } = useActiveFilePath(mockSocket);

    const {
        activeFileContent,
        getActiveFileContent,
        resetState: resetActiveFileContent,
    } = useActiveFileContent(mockSocket, activeFilePath);

    const {
        addTerminalOutputListener,
        removeTerminalOutputListener,
        resetState: resetTerminal,
    } = useTerminal(mockSocket, 'recorder');

    const handleReset = useCallback(() => {
        resetUsers();
        resetActiveFilePath();
        resetActiveFileContent();
        resetTerminal();
    }, [resetActiveFileContent, resetActiveFilePath, resetTerminal, resetUsers]);

    return (
        <roomContext.Provider
            value={{
                myId: '',
                users,
                changeMyUser: () => {},
                reportCopy: () => {},
                activeFilePath,
                availableFiles,
                uploadFile: () => {},
                changeActiveFilePath: () => {},
                activeFileContent,
                getActiveFileContent,
                updateActiveFileContent: () => {},
                writeToTerminal: () => {},
                addTerminalOutputListener,
                removeTerminalOutputListener,
            }}
        >
            {children}
            <Playback recording={recording} onEmit={receiveEvent} onReset={handleReset} />
        </roomContext.Provider>
    );
};
