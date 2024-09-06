import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

import type { C2SEvent, S2CEvent } from '~/../../insider/src/eventNames';
import type { ChangeMyUserRequest, User } from '~/../../insider/src/controllers/users';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const useRoomUsers = (
    socket: Socket | null,
    myName: User['name'] | null,
    role: User['role'] | null | undefined,
) => {
    const [users, setUsers] = useState<User[]>([]);

    const changeMyUser = useCallback(
        (data: ChangeMyUserRequest) => {
            if (!socket || !socket.connected) return;
            socket.emit('change-my-user' satisfies C2SEvent, data);

            setUsers(prev => {
                if (!socket || !socket.connected) return prev;

                const newUsers = [...prev];
                const myIndex = newUsers.findIndex(({ id }) => id === socket!.id);
                newUsers[myIndex] = { ...newUsers[myIndex], ...data };
                return newUsers;
            });
        },
        [socket],
    );

    useEffect(() => {
        if (!socket) return;
        if (!myName) return;

        const connectionListener = () => {
            changeMyUser({
                name: myName,
                isFocused: window.document.hasFocus(),
            });
        };
        socket.on('connect', connectionListener);

        const usersChangeListener = (newUsers: User[]) => {
            setUsers(prevUsers => {
                if (role !== 'candidate') {
                    for (const user of prevUsers) {
                        if (user.role !== 'candidate') continue;

                        const newUser = newUsers.find(({ id }) => id === user.id);
                        if (newUser && !newUser.isFocused && user.isFocused) {
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

                return newUsers;
            });
        };
        socket.on('users-changed' satisfies S2CEvent, usersChangeListener);

        const blurListener = () => {
            changeMyUser({ isFocused: false });
        };
        const focusListener = () => {
            changeMyUser({ isFocused: true });
        };

        window.addEventListener('blur', blurListener);
        window.addEventListener('focus', focusListener);

        return () => {
            socket.off('connect', connectionListener);
            socket.off('users-changed' satisfies S2CEvent, usersChangeListener);
            window.removeEventListener('blur', blurListener);
            window.removeEventListener('focus', focusListener);
            setUsers([]);
        };
    }, [changeMyUser, myName, role, socket]);

    return { users, changeMyUser };
};
