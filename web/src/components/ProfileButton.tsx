import { Loader2, LogIn, LogOut, User } from 'lucide-react';
import { trpc } from '~/lib/trpc';
import { Button } from './ui/button';

type TProfileButtonProps = {
    withName?: boolean;
};

export const ProfileButton = ({ withName }: TProfileButtonProps) => {
    const { data, error, isLoading } = trpc.auth.getSelf.useQuery();

    if (isLoading) {
        return <Loader2 className="animate-spin" />;
    }

    if (error) {
        return (
            <Button>
                <LogIn />
            </Button>
        );
    }

    if (data) {
        return (
            <div className="flex items-center gap-2">
                {withName && <span>{data.name}</span>}
                <Button variant="ghost" size="xs" className="aspect-square p-1">
                    <LogOut />
                </Button>
            </div>
        );
    }

    return null;
};
