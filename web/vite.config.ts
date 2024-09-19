import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
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
                '^/insider/.*?/ws': {
                    ws: true,
                    rewrite: path => path.replace(/^\/insider\/.*?\/ws+/, ''),
                    target: `ws://localhost:${env.INSIDER_WS_PORT || 5050}`,
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
    };
});
