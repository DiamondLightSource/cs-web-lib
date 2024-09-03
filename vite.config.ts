import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react(), eslint()],
        test: {
            environment: 'jsdom',
            include: ['**/*.test.ts', '**/*.test.tsx'],
            globals: true,
            setupFiles: 'src/setupTests.tsx'
        },
    }
})
