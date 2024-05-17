import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { TrpcProvider } from '~/components/contexts/Trpc';
import { Toaster } from '~/components/ui/sonner';
import { ThemeProvider } from '~/components/ui/theme-provider';

export const Route = createRootRoute({
    component: () => (
        <TrpcProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Toaster />
                <Outlet />
                <TanStackRouterDevtools />
            </ThemeProvider>
        </TrpcProvider>
    ),
});
