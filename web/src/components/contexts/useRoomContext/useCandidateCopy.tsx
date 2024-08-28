import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { User } from '~/../../../insider/src/controllers/users';
import type { C2SEvent, S2CEvent } from '~/../../../insider/src/eventNames';

export const useCandidateCopy = (
    socket: Socket | null,
    users: User[],
    myRole?: User['role'] | null,
) => {
    useEffect(() => {
        if (!socket || !socket.connected) return;

        const handler = (userId: string) => {
            const user = users.find(({ id }) => id === userId);
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

        socket.on('candidate-copied' satisfies S2CEvent, handler);
        return () => {
            socket?.off('candidate-copied' satisfies S2CEvent, handler);
        };
    }, [socket, users]);

    const reportCopy = useCallback(() => {
        if (!socket || !socket.connected) return;
        if (myRole !== 'candidate') return;
        socket.emit('copy' satisfies C2SEvent);
    }, [myRole, socket]);

    return { reportCopy };
};
