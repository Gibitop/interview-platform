import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

import type { C2SEvent, S2CEvent } from '~insider/eventNames';
import type { User } from '~insider/types/users';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { TRoomContext } from '.';

export const useRoomUsers = (
    socket: Socket | null,
    myName: User['name'] | null,
    role: User['role'] | null | undefined,
) => {
    const [users, setUsers] = useState<User[]>([]);

    const changeMyUser: TRoomContext['changeMyUser'] = useCallback(
        dataOrSetter => {
            if (!socket || !socket.connected) return;

            setUsers(prev => {
                if (!socket || !socket.connected) return prev;

                const newUsers = [...prev];
                const myIndex = newUsers.findIndex(({ id }) => id === socket!.id);

                if (myIndex === -1) return prev;

                const data =
                    typeof dataOrSetter === 'function'
                        ? dataOrSetter(newUsers[myIndex])
                        : dataOrSetter;

                // ! Side effect. Might cause problems
                // TODO: Fix this in refactor
                if (role !== 'recorder') {
                    let ack = false;
                    socket.emit('change-my-user' satisfies C2SEvent, data, () => {
                        ack = true;
                    });
                    setTimeout(() => {
                        if (!ack) {
                            changeMyUser(dataOrSetter);
                        }
                    }, 200);
                }
                newUsers[myIndex] = { ...newUsers[myIndex], ...data };
                return newUsers;
            });
        },
        [role, socket],
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
                                <span className="flex flex-wrap gap-2 items-center">
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

    const resetState = () => {
        setUsers([]);
    };

    return { users, changeMyUser, resetState };
};
