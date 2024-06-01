import { Crown, Eye } from 'lucide-react';
import { useRoomContext } from './contexts/RoomContext';
import { cn } from '~/utils/shadcn';
import type { Role } from '../../../insider/src/sockets';

type RoleIconProps = {
    isFocused: boolean;
    className: string;
};

const RoleIconMap: Record<Role, React.JSX.ElementType> = {
    host: ({ className, isFocused }: RoleIconProps) => (
        <Crown
            className={cn(
                'size-3',
                isFocused && 'text-green-500',
                !isFocused && 'text-red-500',
                className,
            )}
        />
    ),
    candidate: ({ className, isFocused }: RoleIconProps) => (
        <div
            className={cn(
                'size-2 rounded-full',
                isFocused && 'bg-green-500',
                !isFocused && 'bg-red-500',
                className,
            )}
        />
    ),
    spectator: ({ className, isFocused }: RoleIconProps) => (
        <Eye
            className={cn(
                'size-3',
                isFocused && 'text-green-500',
                !isFocused && 'text-red-500',
                className,
            )}
        />
    ),
};

export const Participants = () => {
    const roomContext = useRoomContext();
    if (!roomContext) return null;

    return (
        <div>
            <ul className="flex gap-3">
                {roomContext.awareness.map(({ id, isFocused, role, color, name }) => {
                    const Icon = RoleIconMap[role];

                    return (
                        <li
                            key={id}
                            className="flex items-center gap-1.5 px-2 rounded-md"
                            style={{ border: `1px solid ${color}` }}
                        >
                            <Icon isFocused={isFocused} />
                            {name ?? id ?? 'Unknown'}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
