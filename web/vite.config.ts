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
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            },
            '/ws': {
                ws: true,
                target: 'ws://localhost:3000',
            },
            '/public': {
                target: 'http://localhost:5173',
                rewrite: path => path.replace(/^\/public/, ''),
            },
        },
    },
    resolve: {
        alias: {
            '~': path.resolve(__dirname, './src'),
            '~public': path.resolve(__dirname, './public'),
        },
    },
});
