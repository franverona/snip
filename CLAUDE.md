# CLAUDE.md

Guidelines for Claude Code when working in this repository.

## Architecture rules

- **Single source of truth for types**: all Zod schemas and TypeScript types live in `packages/types/src/`. Never define API request/response types inside `apps/api` or `apps/web` — import from `@snip/types` instead.
- **No tRPC**: the frontend uses plain `fetch` via `apps/web/src/lib/api.ts`.
- **No authentication**: this project intentionally has no auth layer.

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

## Database

- Schema is defined in `apps/api/src/db/schema.ts` using Drizzle ORM.
- After changing the schema, run `pnpm --filter api run migrate:generate` then `pnpm migrate`.
- Never write raw SQL — use Drizzle's query builder.
- If `pnpm migrate` fails with `ECONNREFUSED`, the Docker container may need to be recreated: `docker compose down && docker compose up -d`.

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

## Adding a new API endpoint

1. Add the Zod schema to `packages/types/src/schemas.ts` and export the inferred type from `packages/types/src/index.ts`.
2. Implement the service logic in `apps/api/src/services/`.
3. Register the route in the appropriate file under `apps/api/src/routes/`.
4. Update `apps/web/src/lib/api.ts` with the new typed fetch call.

## Common commands

```bash
pnpm dev                                    # start all apps
pnpm build                                  # build all packages
pnpm lint                                   # lint all packages
pnpm format                                 # format all files
npx tsc -b --noEmit                         # type-check everything from the root
pnpm --filter api run migrate:generate      # generate migrations after schema change
pnpm migrate                                # apply migrations
```
