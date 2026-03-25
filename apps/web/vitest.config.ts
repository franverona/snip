import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-oxc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@snip/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
  },
})
