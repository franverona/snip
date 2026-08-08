import { defineConfig, devices } from '@playwright/test'

const WEB_PORT = 3000
const API_PORT = 3001
const WEB_URL = `http://localhost:${WEB_PORT}`
const API_URL = `http://localhost:${API_PORT}`

// Starting real servers (not mocks) — these tests exercise the actual API, DB, and
// SSR pages end to end. Requires a reachable Postgres at DATABASE_URL with migrations
// already applied; see apps/e2e/README.md.
export default defineConfig({
  testDir: './tests',
  // Default 30s is tight once you add cold webServer startup on top of the test's own
  // steps — bump it so a slower CI runner doesn't flake on timing alone.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter api run start',
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
      env: {
        PORT: String(API_PORT),
        BASE_URL: API_URL,
        CORS_ORIGIN: WEB_URL,
        DATABASE_URL: process.env['DATABASE_URL'] ?? 'postgresql://snip:snip@localhost:5432/snip',
        IP_HASH_SECRET: process.env['IP_HASH_SECRET'] ?? 'e2e-test-secret',
      },
    },
    {
      command: 'pnpm --filter web run start',
      url: WEB_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
      env: {
        PORT: String(WEB_PORT),
        NEXT_PUBLIC_API_URL: API_URL,
        API_URL,
      },
    },
  ],
})
