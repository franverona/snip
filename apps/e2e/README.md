# E2E tests

Playwright tests that drive the real app end to end: the built API and web servers, a real
Postgres database, a real browser. No mocks.

## Running locally

1. Start Postgres and apply migrations (once):

   ```bash
   docker compose up -d db
   DATABASE_URL=postgresql://snip:snip@localhost:5432/snip pnpm --filter api run migrate
   ```

2. Build the app (Playwright starts the built servers, not `dev`):

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm build
   ```

3. Install browsers (once):

   ```bash
   pnpm --filter e2e exec playwright install chromium
   ```

4. Run the tests:

   ```bash
   DATABASE_URL=postgresql://snip:snip@localhost:5432/snip pnpm test:e2e
   ```

`playwright.config.ts`'s `webServer` entries start `apps/api` and `apps/web` automatically
(`reuseExistingServer` when not in CI, so a `pnpm dev` already running on 3000/3001 is reused
instead of relaunched). `IP_HASH_SECRET` defaults to a test value if unset.

Use `pnpm --filter e2e run test:ui` for Playwright's interactive UI mode while iterating on a test.
