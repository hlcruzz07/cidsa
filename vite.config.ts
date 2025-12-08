import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true, // Blade full reload
        }),
        react(), // HMR for React TSX
        tailwindcss(),
        wayfinder({ formVariants: true }),
    ],
    server: {
        watch: {
            usePolling: true, // optional for Windows
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});
