import { Link, useLocation } from '@tanstack/react-router';
import { Logo } from './Logo';
import { ProfileButton } from './ProfileButton';
import { Button } from './ui/button';
import { cn } from '~/utils/shadcn';

type ControlPanelLayoutProps = {
    children: React.ReactNode;
    className?: string;
};

type NavButtonProps = {
    children: React.ReactNode;
    to: string;
};

const NavButton = ({ to, children }: NavButtonProps) => {
    const { pathname } = useLocation();

    return (
        <Button
            asChild
            size="sm"
            className="w-full"
            variant={pathname === to ? 'secondary' : 'ghost'}
        >
            <Link to={to}>{children}</Link>
        </Button>
    );
};

export const ControlPanelLayout = ({ children, className }: ControlPanelLayoutProps) => {
    return (
        <div className="flex h-screen">
            <nav className="flex h-full">
                <nav className="flex flex-col items-center justify-between p-4 border-r w-60 border-neutral-800">
                    <div className="flex-1 w-full">
                        <Logo isSmall isCentered className="mt-1.5 mb-6 w-full" />

                        <div className="flex flex-col gap-1">
                            <NavButton to="/rooms">My rooms</NavButton>
                            <NavButton to="/recordings">My recordings</NavButton>
                        </div>
                    </div>
                    <ProfileButton withName fullWidth />
                </nav>
            </nav>
            <div className="w-full overflow-y-auto">
                <main className={cn('container p-4', className)}>{children}</main>
            </div>
        </div>
    );
};
