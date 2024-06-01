import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '~/lib/trpc';
import { useRoomStore } from '~/stores/room';

import type { MyAwarenessChangeRequest } from '~/../../insider/src/eventHandlers/my-awareness-change';
import type { AwarenessResponse } from '~/../../insider/src/emits/awareness-change';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Model, Patch, StrNode, StrApi } from 'json-joy/lib/json-crdt';

export type TRoomContextProviderProps = {
    wsPort: number;
    children: React.ReactNode;
};

type TRoomContext = {
    myId: string;
    awareness: AwarenessResponse;
    getActiveFileContent: () => string;
    changeMyAwareness: (data: MyAwarenessChangeRequest) => void;
    reportCopy: () => void;
    updateActiveFileContent: (cb: (ins: StrApi['ins'], del: StrApi['del']) => void) => void;
    writeToTerminal: (data: string) => void;
    addTerminalOutputListener: (cb: (data: string) => void) => void;
    removeTerminalOutputListener: (cb: (data: string) => void) => void;
};

const roomContext = createContext<TRoomContext | null>(null);

function emitWithRetry(socket: Socket, event: string, arg: unknown) {
    socket.timeout(2000).emit(event, arg, (err: unknown) => {
        if (err) {
            // no ack from the server, let's retry
            console.log('resent');
            emitWithRetry(socket, event, arg);
        }
    });
}

export const RoomProvider = ({ wsPort, children }: TRoomContextProviderProps) => {
    const roomStore = useRoomStore(data => data);
    const { data: selfUser } = trpc.auth.getSelf.useQuery();

    const lastPatchTimeRef = useRef<number>(-1);
    const socketRef = useRef<Socket | null>(null);
    const activeFileRef = useRef<Model<StrNode<string>> | null>(null);
    const [awareness, setAwareness] = useState<AwarenessResponse>([]);

    const terminalOutputListeners = useRef<((data: string) => void)[]>([]);
    const addTerminalOutputListener = useCallback((cb: (data: string) => void) => {
        terminalOutputListeners.current.push(cb);
    }, []);
    const removeTerminalOutputListener = useCallback((cb: (data: string) => void) => {
        terminalOutputListeners.current = terminalOutputListeners.current.filter(
            listener => listener !== cb,
        );
    }, []);

    const changeMyAwareness = useCallback((data: MyAwarenessChangeRequest) => {
        if (!socketRef.current || !socketRef.current.connected) return;
        socketRef.current.emit('my-awareness-change', data);

        setAwareness(prev => {
            if (!socketRef.current || !socketRef.current.connected) return prev;

            const newAwareness = [...prev];
            const myIndex = newAwareness.findIndex(({ id }) => id === socketRef.current!.id);
            newAwareness[myIndex] = { ...newAwareness[myIndex], ...data };
            return newAwareness;
        });
    }, []);

    const reportCopy = useCallback(() => {
        if (!socketRef.current || !socketRef.current.connected) return;
        if (roomStore?.role !== 'candidate') return;
        socketRef.current.emit('copy');
    }, [roomStore?.role]);

    const getActiveFileContent = useCallback(
        () => activeFileRef.current?.api.str('').view() ?? '',
        [],
    );
    const updateActiveFileContent: TRoomContext['updateActiveFileContent'] = useCallback(
        cb => {
            if (!activeFileRef.current || !socketRef.current || !socketRef.current.connected)
                return;
            if (roomStore?.role === 'host' && roomStore.isSpectator) return;

            const str = activeFileRef.current.api.str('');
            cb(str.ins.bind(str), str.del.bind(str));

            const patch = activeFileRef.current.api.flush();
            emitWithRetry(socketRef.current, 'active-file-content-patch', patch.toBinary());
            // socketRef.current.emit('active-file-content-patch', patch.toBinary());
        },
        [
            // @ts-expect-error - isSpectator is undefined for candidate
            roomStore?.isSpectator,
            roomStore?.role,
        ],
    );

    const writeToTerminal = useCallback(
        (data: string) => {
            if (!socketRef.current || !socketRef.current.connected) return;
            socketRef.current.emit('terminal-input', data);
        },
        [socketRef],
    );

    useEffect(() => {
        if (!roomStore) return;
        if (roomStore.role !== 'candidate' && !selfUser) return;

        socketRef.current = io(`ws://${location.hostname}:${wsPort}`, {
            transports: ['websocket'],
            auth: {
                token: roomStore.role === 'host' ? roomStore.token : undefined,
                spectatorMode: roomStore.role === 'host' && roomStore.isSpectator,
            },
            autoConnect: false,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            if (socket.recovered) {
                socket.emit('active-file-content-recover', lastPatchTimeRef.current);
                console.log('Recovered');
            } else {
                console.log('New session');
            }
            changeMyAwareness({
                name: roomStore.role === 'candidate' ? roomStore.name : selfUser!.name,
                isFocused: window.document.hasFocus(),
            });
        });

        socket.on('reconnect', () => console.log('Reconnected'));

        socket.on('awareness-change', (newAwareness: AwarenessResponse) => {
            setAwareness(prevAwareness => {
                if (roomStore.role !== 'candidate') {
                    for (const user of prevAwareness) {
                        if (user.role !== 'candidate') continue;
                        const newAwarenessUser = newAwareness.find(({ id }) => id === user.id);
                        if (newAwarenessUser && !newAwarenessUser.isFocused && user.isFocused) {
                            toast(
                                <span className="flex gap-2 items-center">
                                    <AlertTriangle size={16} />
                                    Candidate{' '}
                                    <span className="font-semibold" style={{ color: user.color }}>
                                        {user.name}
                                    </span>{' '}
                                    has lost focus
                                </span>,
                                { closeButton: true },
                            );
                        }
                    }
                }

                return newAwareness;
            });
        });

        socket.on('active-file-content-rewrite', (data: ArrayBuffer) => {
            activeFileRef.current = Model.fromBinary(new Uint8Array(data)) as unknown as Model<
                StrNode<string>
            >;
        });

        socket.on('active-file-content-patch', (data: ArrayBuffer) => {
            if (!activeFileRef.current) {
                socket.emit('request-active-file-content');
                return;
            }
            activeFileRef.current.applyPatch(Patch.fromBinary(new Uint8Array(data)));
        });

        socket.on('terminal-output', (data: string) => {
            terminalOutputListeners.current.forEach(cb => cb(data));
            // console.log(data);
        });

        const blurListener = () => {
            changeMyAwareness({ isFocused: false });
        };
        const focusListener = () => {
            changeMyAwareness({ isFocused: true });
        };

        window.addEventListener('blur', blurListener);
        window.addEventListener('focus', focusListener);

        socket.connect();

        return () => {
            window.removeEventListener('blur', blurListener);
            window.removeEventListener('focus', focusListener);

            socket.offAny();
            socket.disconnect();
            socketRef.current = null;

            setAwareness([]);
        };
    }, [changeMyAwareness, roomStore, selfUser, wsPort]);

    useEffect(() => {
        if (!socketRef.current || !socketRef.current.connected) return;

        const handler = (userId: string) => {
            const user = awareness.find(({ id }) => id === userId);
            if (!user) return;
            toast(
                <span className="flex gap-2 items-center">
                    <AlertTriangle size={16} />
                    Candidate{' '}
                    <span className="font-semibold" style={{ color: user.color }}>
                        {user.name}
                    </span>{' '}
                    has copied code
                </span>,
                { closeButton: true },
            );
        };

        socketRef.current.on('candidate-copy', handler);
        return () => {
            socketRef.current?.off('candidate-copy', handler);
        };
    }, [awareness]);

    const providerValue = useMemo(
        () => ({
            awareness,
            getActiveFileContent,
            changeMyAwareness,
            reportCopy,
            updateActiveFileContent,
            writeToTerminal,
            myId: socketRef.current?.id ?? '',
            addTerminalOutputListener,
            removeTerminalOutputListener,
        }),
        [
            awareness,
            changeMyAwareness,
            writeToTerminal,
            getActiveFileContent,
            reportCopy,
            updateActiveFileContent,
            addTerminalOutputListener,
            removeTerminalOutputListener,
        ],
    );

    return <roomContext.Provider value={providerValue}>{children}</roomContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRoomContext = () => useContext(roomContext);
