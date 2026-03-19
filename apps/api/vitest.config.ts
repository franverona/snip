import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@snip/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      IP_HASH_SECRET: 'test-secret',
    },
  },
})
