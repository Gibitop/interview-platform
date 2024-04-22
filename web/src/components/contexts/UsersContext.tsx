import { createContext, useContext, useEffect, useState } from 'react';
import { useYjs } from './YjsContext';

export type TUser = {
    id: number;
    name: string;
    isActive: boolean;
    color: string;
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

    useEffect(() => {
        if (!yjs) return;
        const updateUsers = () => {
            const newValue = [...yjs.awareness.getStates().entries()].map(([id, state]) => ({
                id,
                name: state.user?.name,
                isActive: state.user?.isActive,
                color: state.user?.color,
            }));
            setValue(newValue);
        };

        yjs.awareness.on('change', updateUsers);
        updateUsers();

        yjs.awareness.setLocalStateField('user', {
            name: userName,
            isActive: true,
            color: '',
        } satisfies Partial<Omit<TUser, 'id'>>);

        // We don't know how many users are already connected at this time
        // So... workaround by setting the color after a delay
        setTimeout(() => {
            yjs.awareness.setLocalStateField('user', {
                ...yjs.awareness.getLocalState()?.user,
                color: colors[yjs.awareness.getStates().size % colors.length],
            } satisfies Partial<Omit<TUser, 'id'>>);
        }, 200);

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
