import clsx from 'clsx';
import { useUsers } from './contexts/UsersContext';
import { Crown } from 'lucide-react';

export const Participants = () => {
    const users = useUsers();

    return (
        <div>
            <ul className="flex gap-3">
                {users.map(user => (
                    <li
                        key={user.id}
                        className="flex items-center gap-1.5 px-2 rounded-md"
                        style={{ border: `1px solid ${user.color}` }}
                    >
                        {user.isHost ? (
                            <Crown
                                className={clsx(
                                    'size-3 rounded-full',
                                    user.isActive && 'text-green-500',
                                    !user.isActive && 'text-red-500',
                                )}
                            />
                        ) : (
                            <div
                                className={clsx(
                                    'size-2 rounded-full',
                                    user.isActive && 'bg-green-500',
                                    !user.isActive && 'bg-red-500',
                                )}
                            />
                        )}
                        {user.name ?? user.id ?? 'Unknown'}
                    </li>
                ))}
            </ul>
        </div>
    );
};
