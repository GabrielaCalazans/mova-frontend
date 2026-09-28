import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process.cwd(), '')
  const apiBackendUrl = env.API_BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiBackendUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      fileParallelism: false,
      maxWorkers: 1,
      setupFiles: './src/test/setupTests.js',
      exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', '**/coverage/**', '**/test-results/**', '**/e2e/**'],
    },
  }
})
