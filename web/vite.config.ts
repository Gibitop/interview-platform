import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), TanStackRouterVite()],
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
        host: '127.0.0.1',
        proxy: {
            '/ws': {
                ws: true,
                target: 'ws://localhost:4444',
            },
        },
    },
    resolve: {
        alias: {
            '~': path.resolve(__dirname, './src'),
        },
    },
});
