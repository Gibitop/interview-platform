import { createContext, useContext, useEffect, useState } from 'react';
import { useYjs } from './YjsContext';
import { useRoomStore } from '~/stores/room';

export type TUser = {
    id: number;
    name: string;
    isActive: boolean;
    color: string;
    joinedAt: number;
    isHost: boolean;
};

export type TUsersContext = TUser[];
const usersContext = createContext<TUsersContext>([]);

export type TUsersProviderProps = {
    userName: string;
    children: React.ReactNode;
};

const colors = [
    // This comment is here so prettier does not try to put all colors in one line
    '#ef4444',
    '#7c3aed',
    '#0284c7',
    '#16a34a',
];

export const UsersProvider = ({ children, userName }: TUsersProviderProps) => {
    const yjs = useYjs();
    const [value, setValue] = useState<TUsersContext>([]);
    const isHost = useRoomStore(s => s.isHost);

    useEffect(() => {
        if (!yjs) return;
        const updateUsers = () => {
            const myJoinedAt = yjs.awareness.getLocalState()?.user?.joinedAt ?? Number.MAX_VALUE;
            let myIndex = 0;
            const newValue: TUser[] = [];

            for (const stateEntry of yjs.awareness.getStates().entries()) {
                const [id, state] = stateEntry as [number, { user?: TUser }];

                if (!state.user) continue;

                if (state.user.joinedAt < myJoinedAt) myIndex++;

                newValue.push({
                    ...state.user,
                    id,
                });
            }

            yjs.awareness.setLocalStateField('user', {
                ...yjs.awareness.getLocalState()?.user,
                color: colors[myIndex % colors.length],
            } satisfies Partial<Omit<TUser, 'id'>>);

            setValue(newValue);
        };

        yjs.awareness.setLocalStateField('user', {
            name: userName,
            isActive: true,
            color: '',
            joinedAt: Date.now(),
            isHost: isHost,
        } satisfies Partial<Omit<TUser, 'id'>>);

        yjs.awareness.on('change', updateUsers);
        updateUsers();

        // Workaround for awareness not updating on first render
        setTimeout(updateUsers, 500);

        const blurListener = () => {
            yjs.awareness.setLocalStateField('user', {
                ...yjs.awareness.getLocalState()?.user,
                isActive: false,
            } satisfies Partial<Omit<TUser, 'id'>>);
        };
        const focusListener = () => {
            yjs.awareness.setLocalStateField('user', {
                ...yjs.awareness.getLocalState()?.user,
                isActive: true,
            } satisfies Partial<Omit<TUser, 'id'>>);
        };

        window.addEventListener('blur', blurListener);
        window.addEventListener('focus', focusListener);

        return () => {
            yjs.awareness.off('change', updateUsers);
            window.removeEventListener('blur', blurListener);
            window.removeEventListener('focus', focusListener);
        };
    }, [yjs, userName]);

    return <usersContext.Provider value={value}>{children}</usersContext.Provider>;
};

export const useUsers = () => useContext(usersContext);
