import { useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import type { C2SEvent, S2CEvent } from '~insider/eventNames';
import type { Role } from '~insider/types/users';

export const useTerminal = (socket: Socket | null, role?: Role) => {
    const terminalOutputListeners = useRef<((data: string) => void)[]>([]);

    const addTerminalOutputListener = useCallback((cb: (data: string) => void) => {
        terminalOutputListeners.current.push(cb);
    }, []);

    const removeTerminalOutputListener = useCallback((cb: (data: string) => void) => {
        terminalOutputListeners.current = terminalOutputListeners.current.filter(
            listener => listener !== cb,
        );
    }, []);

    const writeToTerminal = useCallback(
        (data: string) => {
            if (!socket || !socket.connected) return;
            if (role !== 'host') return;
            socket.emit('input-to-terminal' satisfies C2SEvent, data);
        },
        [role, socket],
    );

    useEffect(() => {
        if (!socket) return;

        const handler = (data: string) => {
            terminalOutputListeners.current.forEach(cb => cb(data));
        };

        socket.on('terminal-outputted' satisfies S2CEvent, handler);

        return () => {
            socket.off('terminal-outputted' satisfies S2CEvent, handler);
        };
    }, [socket]);

    const resetState = useCallback(() => {
        terminalOutputListeners.current.forEach(listener => listener('\x1b[2J\x1b[H'));
    }, []);

    return { addTerminalOutputListener, removeTerminalOutputListener, writeToTerminal, resetState };
};
