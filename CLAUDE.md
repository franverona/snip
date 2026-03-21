# CLAUDE.md

Guidelines for Claude Code when working in this repository.

## Architecture rules

- **Single source of truth for types**: all Zod schemas and TypeScript types live in `packages/types/src/`. Never define API request/response types inside `apps/api` or `apps/web` — import from `@snip/types` instead.
- **No tRPC**: the frontend uses plain `fetch` via `apps/web/src/lib/api.ts`.
- **Optional access protection**: `DASHBOARD_PASSWORD` (web) gates the dashboard behind a login page. `API_KEY` (api) requires `Authorization: Bearer <key>` on mutating endpoints. Both default to off — no breaking change.

## Frontend

- Use **styled-components** for all styling — no Tailwind, no CSS modules, no inline style objects except for one-off layout adjustments.
- New pages go under `apps/web/src/app/` following Next.js App Router conventions.
- Fetch data in Server Components where possible; use Client Components (`'use client'`) only when interactivity is required.
- The `StyledComponentsRegistry` in `apps/web/src/lib/StyledComponentsRegistry.tsx` is required for SSR — do not remove it.
- Avoid locale-sensitive formatting (`toLocaleString()`, `toLocaleDateString()` with `undefined` locale) in components that are server-rendered — always pass an explicit locale (e.g. `'en-US'`) to prevent hydration mismatches.

## Backend

- `apps/api` is an ESM package (`"type": "module"`). All internal imports must use `.js` extensions.
- Route handlers validate request bodies with Zod schemas imported from `@snip/types`.
- Click recording is fire-and-forget (`setImmediate`) — never block the redirect response on it.
- The redirect route (`/:slug`) must remain registered last in `apps/api/src/index.ts` to avoid shadowing other routes.
- Rate limiting uses `@fastify/rate-limit` with a global fallback registered in `index.ts`. Only `POST /urls` has a per-route override driven by `RATE_LIMIT_CREATE_PER_MINUTE` (default: 10 req/min). Other routes inherit the global limit. Do not add more env vars for per-route limits without good reason.
- CORS is restricted to a single origin via `@fastify/cors`. The allowed origin is `CORS_ORIGIN` if set, falling back to `BASE_URL`. In production, `CORS_ORIGIN` must be set to the web app's origin (e.g. `https://snip.example.com`) — `BASE_URL` is the API's own URL and is not a safe CORS fallback in production.
- Visitor IPs are hashed with HMAC-SHA-256 keyed by `IP_HASH_SECRET` (required, no default — startup fails fast if missing). Changing this secret invalidates all existing stored hashes and resets unique-visitor deduplication.
- When adding a new required env var to `config.ts`, also add a stub value in `apps/api/vitest.config.ts` so `config.ts` doesn't throw at import time in tests.

## Database

- Schema is defined in `apps/api/src/db/schema.ts` using Drizzle ORM.
- After changing the schema, run `pnpm --filter api run migrate:generate` then `pnpm migrate`.
- Never write raw SQL — use Drizzle's query builder.
- To populate the database with sample data for local development, run `pnpm seed`. The seed script is at `apps/api/src/db/seed.ts` — it **deletes all existing data** before inserting 40 URLs and 500 randomised clicks.
- If `pnpm migrate` fails with `ECONNREFUSED`, the Docker container may need to be recreated: `docker compose down && docker compose up -d`.
- Pool is configured in `apps/api/src/db/client.ts`. `DATABASE_POOL_MAX` (default: 10) is the only tunable env var — `idleTimeoutMillis` (30s) and `connectionTimeoutMillis` (5s) are hardcoded. Do not add more pool env vars without good reason.

## Environment variables

Keep this table up to date when adding, removing, or changing env vars. Also update the matching table in `README.md`.

### API (`apps/api`)

| Variable                       | Required | Default                 | Description                                                                                                                       |
| ------------------------------ | -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | **Yes**  | —                       | PostgreSQL connection string                                                                                                      |
| `IP_HASH_SECRET`               | **Yes**  | —                       | HMAC-SHA-256 secret for hashing visitor IPs. Changing it invalidates all stored hashes and resets unique-visitor deduplication    |
| `PORT`                         | No       | `3001`                  | Port the API server listens on                                                                                                    |
| `BASE_URL`                     | No       | `http://localhost:3001` | Public URL of the API. Used as the CORS allowed origin fallback when `CORS_ORIGIN` is not set                                     |
| `CORS_ORIGIN`                  | No       | `BASE_URL`              | Allowed CORS origin. In production, set this to the web app's origin — `BASE_URL` is the API's own URL and is not a safe fallback |
| `RATE_LIMIT_CREATE_PER_MINUTE` | No       | `10`                    | Max requests per minute for `POST /urls`                                                                                          |
| `DATABASE_POOL_MAX`            | No       | `10`                    | Maximum number of connections in the database pool                                                                                |
| `API_KEY`                      | No       | —                       | When set, `POST /urls` and `DELETE /urls/:slug` require `Authorization: Bearer <key>`. Unset means those endpoints are public     |

### Web (`apps/web`)

| Variable                  | Required | Default                 | Description                                                                                                                                        |
| ------------------------- | -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | No       | `http://localhost:3001` | API base URL baked into the browser bundle. Used for client-side fetches                                                                           |
| `API_URL`                 | No       | `NEXT_PUBLIC_API_URL`   | API base URL for server-side (SSR) fetches. In Docker, set to the internal service URL (e.g. `http://api:3001`) so SSR can reach the API container |
| `NEXT_TELEMETRY_DISABLED` | No       | `1`                     | Set to `1` to disable Next.js telemetry                                                                                                            |
| `DASHBOARD_PASSWORD`      | No       | —                       | When set, all dashboard pages require a password. Unauthenticated visitors are redirected to `/login`                                              |
| `API_KEY`                 | No       | —                       | Forwarded as `Authorization: Bearer <key>` on mutating API requests. Must match `API_KEY` in `apps/api`                                            |

## Code style

- Prettier and ESLint are enforced via a pre-commit hook (lint-staged + Husky). Formattin runs automatically on staged files — do not fight the formatter.
- ESLint config is in `eslint.config.ts` (flat config). Key rules:
  - `unused-imports/no-unused-imports` — unused imports are errors and auto-fixed
  - `@typescript-eslint/consistent-type-imports` — always use `import type` for type-only imports
- Prettier config is in `.prettierrc`: single quotes, no semicolons, trailing commas, 100-char print width, LF line endings.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). commitlint enforces this on every commit via Husky.

```
<type>(<scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`, `build`.

## TypeScript

- Root `tsconfig.json` uses project references. To type-check everything at once: `tsc -b --noEmit` (not plain `tsc --noEmit`).
- Each package has `composite: true` in its tsconfig to support project references.
- `noEmit` must be passed via CLI, not set in `tsconfig.json`, because it conflicts with `composite`.

## Testing

- Tests live in `apps/api` alongside source files (`*.test.ts`).
- Framework is **Vitest**. Run with `pnpm --filter api run test` (no database required — all DB calls are mocked).
- `apps/api/src/db/__mocks__/client.ts` is the shared manual mock for `db/client.js`. Route tests call `vi.mock('../db/client.js')` with no factory to use it. Service tests override it with a custom factory via `vi.hoisted`.
- Route tests use Fastify's `inject()` — no real HTTP server is started.
- `apps/api/vitest.config.ts` sets a stub `DATABASE_URL` env var so `config.ts` doesn't throw at import time.
- When adding a new route, add tests in `apps/api/src/routes/<name>.test.ts`. When adding a new service, add tests in `apps/api/src/services/<name>.test.ts`.

## Adding a new API endpoint

1. Add the Zod schema to `packages/types/src/schemas.ts` and export the inferred type from `packages/types/src/index.ts`.
2. Implement the service logic in `apps/api/src/services/`.
3. Register the route in the appropriate file under `apps/api/src/routes/`.
4. Update `apps/web/src/lib/api.ts` with the new typed fetch call.
5. Add unit tests for the service (`*.test.ts`) and route (`*.test.ts`).

## Common commands

```bash
pnpm dev                                    # start all apps
pnpm build                                  # build all packages
pnpm lint                                   # lint all packages
pnpm format                                 # format all files
npx tsc -b --noEmit                         # type-check everything from the root
pnpm --filter api run test                  # run API unit tests (no DB required)
pnpm --filter api run test:watch            # run API tests in watch mode
pnpm --filter api run migrate:generate      # generate migrations after schema change
pnpm migrate                                # apply migrations
pnpm seed                                   # seed DB with sample URLs and clicks (clears existing data)
```
