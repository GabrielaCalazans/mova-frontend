import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process.cwd(), '')
  const apiBackendUrl = env.API_BACKEND_URL || 'http://localhost:3000'
  const useAllure = Boolean(globalThis.process.env.CI)

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
      // Allure só no CI (mesmo allure-results do Playwright, publicado no Pages).
      setupFiles: [...(useAllure ? ['allure-vitest/setup'] : []), './src/test/setupTests.js'],
      reporters: useAllure ? ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]] : ['default'],
      // Nunca o backend local: host reservado que não resolve (ver setupTests).
      env: { VITE_API_BASE_URL: 'http://mova-api.test.invalid/api' },
      exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', '**/coverage/**', '**/test-results/**', '**/e2e/**'],
    },
  }
})
