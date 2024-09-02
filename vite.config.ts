import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        test: {
            environment: 'jsdom',
            include: ['**/*.test.ts', '**/*.test.ts'],
            globals: true,
            setupFiles: 'src/setupTests.tsx'
        },
    }
})
