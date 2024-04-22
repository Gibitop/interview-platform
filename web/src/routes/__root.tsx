import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '~/components/ui/sonner';
import { ThemeProvider } from '~/components/ui/theme-provider';

export const Route = createRootRoute({
    component: () => (
        <>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Toaster />
                <Outlet />
            </ThemeProvider>
        </>
    ),
});
