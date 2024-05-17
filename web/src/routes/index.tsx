import { Link } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { JoinRoomCard } from '~/components/JoinRoomCard';
import { Logo } from '~/components/Logo';
import { Button } from '~/components/ui/button';

export const Route: unknown = createFileRoute('/')({
    component: () => (
        <main className="min-h-screen grid place-items-center">
            <Button className="absolute right-3 top-3" variant="secondary">
                <Link to="/rooms">Sign in</Link>
            </Button>
            <div className="flex flex-col gap-3">
                <Logo isCentered className="mb-3" />
                <JoinRoomCard />
            </div>
        </main>
    ),
});
