import { LogIn, LogOut } from 'lucide-react';
import { trpc } from '~/lib/trpc';
import { Button } from './ui/button';
import { Link, useNavigate } from '@tanstack/react-router';
import { Skeleton } from './ui/skeleton';

type TProfileButtonProps = {
    withName?: boolean;
};

export const ProfileButton = ({ withName }: TProfileButtonProps) => {
    const navigate = useNavigate();

    const { data, error, isLoading } = trpc.auth.getSelf.useQuery(undefined, { retry: 0 });

    const trpcUtils = trpc.useUtils();
    const { mutate: logout } = trpc.auth.logout.useMutation({
        onSuccess: () => {
            trpcUtils.auth.getSelf.invalidate();
            trpcUtils.rooms.invalidate();
            navigate({ to: '/' });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                {withName && <Skeleton className="h-6 w-48" />}
                <Skeleton className="h-6 aspect-square" />
            </div>
        );
    }

    if (error) {
        return (
            <Button variant="ghost" size="xs" className="aspect-square p-1" asChild>
                <Link to="/rooms">
                    <LogIn />
                </Link>
            </Button>
        );
    }

    if (data) {
        return (
            <div className="flex items-center gap-2">
                {withName && <span>{data.name}</span>}
                <Button
                    variant="ghost"
                    size="xs"
                    className="aspect-square p-1"
                    onClick={() => logout()}
                >
                    <LogOut />
                </Button>
            </div>
        );
    }

    return null;
};
