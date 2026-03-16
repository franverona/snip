# snip

A self-hosted URL shortener that turns long, unwieldy links into clean, shareable slugs and tracks how they perform over time.

## Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Monorepo     | Turborepo + pnpm workspaces                             |
| Backend      | Fastify, Drizzle ORM, PostgreSQL                        |
| Frontend     | Next.js 15 (App Router), styled-components              |
| Shared types | Zod schemas + inferred TypeScript types (`@snip/types`) |
| Database     | PostgreSQL via Docker                                   |

## Project structure

```
apps/
  api/      Fastify REST API
  web/      Next.js frontend
packages/
  types/    Shared Zod schemas and TypeScript types
  tsconfig/ Shared TypeScript base configs
```

## Getting started

### Prerequisites

- Node.js 24.12.0 (use `nvm use` to switch automatically via `.nvmrc`)
- pnpm (`npm install -g pnpm`)
- Docker

### 1. Install dependencies

```bash
pnpm install
```

Husky git hooks are installed automatically via the `prepare` script.

### 2. Start the database

```bash
docker compose up -d
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

`apps/api/.env`:

```
DATABASE_URL=postgresql://snip:snip@localhost:5432/snip
DATABASE_POOL_MAX=10
PORT=3001
BASE_URL=http://localhost:3001
RATE_LIMIT_CREATE_PER_MINUTE=10
CORS_ORIGIN=http://localhost:3000
```

`apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_TELEMETRY_DISABLED=1
```

### 4. Run database migrations

```bash
# Generate migration files from the schema
pnpm --filter api run migrate:generate

# Apply migrations to the database
pnpm migrate
```

### 5. Start development servers

```bash
pnpm dev
```

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

## Scripts

| Command                                  | Description                                  |
| ---------------------------------------- | -------------------------------------------- |
| `pnpm dev`                               | Start all apps in watch mode                 |
| `pnpm build`                             | Build all apps and packages                  |
| `pnpm migrate`                           | Apply pending database migrations            |
| `pnpm lint`                              | Lint all packages with ESLint                |
| `pnpm format`                            | Format all files with Prettier               |
| `pnpm format:check`                      | Check formatting without writing             |
| `npx tsc -b --noEmit`                    | Type-check all packages from the root        |
| `pnpm --filter api run test`             | Run API unit tests (no DB required)          |
| `pnpm --filter api run test:watch`       | Run API tests in watch mode                  |
| `pnpm --filter api run migrate:generate` | Generate migration files from schema changes |

## API reference

| Method   | Path                | Description                                |
| -------- | ------------------- | ------------------------------------------ |
| `POST`   | `/urls`             | Create a short URL                         |
| `GET`    | `/:slug`            | Redirect to original URL (302 / 404 / 410) |
| `GET`    | `/urls/:slug/stats` | Click statistics for a slug                |
| `DELETE` | `/urls/:slug`       | Delete a short URL                         |
| `GET`    | `/health`           | Health check with DB connectivity          |

### POST /urls

```json
{
  "originalUrl": "https://example.com/very/long/path",
  "customSlug": "my-link",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

`customSlug` and `expiresAt` are optional.

## Commit conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/). The format is enforced by commitlint on every commit via a Husky hook.

```
<type>(<scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`, `build`.

```bash
feat(api): add custom slug validation
fix(web): resolve hydration mismatch on stats page
chore(deps): bump drizzle-orm to 0.40.0
```

## CI

GitHub Actions runs four jobs on every push and pull request to `main`:

| Job         | What it does                                                      |
| ----------- | ----------------------------------------------------------------- |
| `lint`      | ESLint + Prettier format check across all packages                |
| `typecheck` | `tsc --noEmit` across all packages via Turborepo                  |
| `test`      | API unit tests via Vitest (no database required, all deps mocked) |
| `build`     | Full production build (runs after lint, typecheck, and test pass) |

Dependabot is configured to open weekly PRs for npm and GitHub Actions updates, grouped by ecosystem (turbo, drizzle, nextjs, fastify, typescript).

## Database schema

**urls**

| Column         | Type      | Notes            |
| -------------- | --------- | ---------------- |
| `id`           | uuid      | Primary key      |
| `slug`         | text      | Unique, not null |
| `original_url` | text      | Not null         |
| `custom_slug`  | boolean   | Default false    |
| `expires_at`   | timestamp | Nullable         |
| `created_at`   | timestamp | Default now      |

**clicks**

| Column       | Type      | Notes                         |
| ------------ | --------- | ----------------------------- |
| `id`         | uuid      | Primary key                   |
| `url_id`     | uuid      | FK → urls.id (cascade delete) |
| `clicked_at` | timestamp | Default now                   |
| `ip_hash`    | text      | SHA-256 hash of IP, nullable  |
| `user_agent` | text      | Nullable                      |
| `referer`    | text      | Nullable                      |
