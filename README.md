<div align="center">

<img src="./screenshots/logo.svg" alt="Snip logo" width="120" />

<h3>Snip</h3>

[![CI](https://github.com/franverona/snip/actions/workflows/ci.yml/badge.svg)](https://github.com/franverona/snip/actions/workflows/ci.yml)

A self-hosted URL shortener that turns long, unwieldy links into clean and shareable slugs.

</div>

## Table of contents

- [Stack](#stack)
- [Screenshots](#screenshots)
- [Getting started](#getting-started)
- [Docker full-stack](#docker-full-stack)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Database schema](#database-schema)

## Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Monorepo     | Turborepo + pnpm workspaces                             |
| Backend      | Fastify, Drizzle ORM, PostgreSQL                        |
| Frontend     | Next.js 16 (App Router), styled-components              |
| Shared types | Zod schemas + inferred TypeScript types (`@snip/types`) |
| Database     | PostgreSQL via Docker                                   |

## Screenshots

### URLs list

<img src="./screenshots/urls-list.png" alt="URLs list" />

### URL stats view

<img src="./screenshots/url-stats.png" alt="URL stats view" />

### Create URL

<img src="./screenshots/create-url.png" alt="Create URL view" />

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
IP_HASH_SECRET=your-hash-secret
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

### 5. (Optional) Seed the database

Populate the database with sample URLs and click data for local development:

```bash
pnpm seed
```

This inserts 40 URLs (including custom slugs, an expiring URL, and an already-expired URL) and 500 randomised clicks spread across the last 90 days. **It clears all existing data first.**

### 6. Build shared packages

```bash
pnpm build
```

This compiles `@snip/types` (and other packages) to `dist/`. Required once after a fresh clone — `pnpm dev` relies on the compiled output.

### 7. Start development servers

```bash
pnpm dev
```

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

## Docker full-stack

Both Dockerfiles use multi-stage builds with `dev` and `prod` targets.

### Dev profile (hot-reloading)

```bash
docker compose --profile dev up
```

Source is mounted as a volume and the same watch-mode dev servers run as local development (`tsx watch` / `next dev`), so edits are reflected immediately without rebuilding the image.

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

> **First run:** Docker builds the image and installs dependencies, which takes a few minutes. Subsequent starts are fast because the layers are cached.

### Prod profile (optimised builds)

Set the required environment variables, then run:

```bash
export IP_HASH_SECRET=your-secret
export CORS_ORIGIN=http://localhost:3000   # or your public web URL
export NEXT_PUBLIC_API_URL=http://localhost:3001  # public API URL seen by the browser

docker compose --profile prod up -d
```

`NEXT_PUBLIC_API_URL` is baked into the browser bundle at build time, so it must be set before the first `docker compose --profile prod up`. If you change it, rebuild the `web-prod` image with `docker compose --profile prod build web-prod`.

The `DATABASE_URL` defaults to the local `db` service (`postgresql://snip:snip@db:5432/snip`). Override it with `export DATABASE_URL=...` to point at an external database instead.

## Scripts

| Command                                  | Description                                  |
| ---------------------------------------- | -------------------------------------------- |
| `pnpm dev`                               | Start all apps in watch mode                 |
| `pnpm build`                             | Build all apps and packages                  |
| `pnpm migrate`                           | Apply pending database migrations            |
| `pnpm seed`                              | Seed the DB with sample URLs and clicks      |
| `pnpm lint`                              | Lint all packages with ESLint                |
| `pnpm format`                            | Format all files with Prettier               |
| `pnpm format:check`                      | Check formatting without writing             |
| `npx tsc -b --noEmit`                    | Type-check all packages from the root        |
| `pnpm --filter api run test`             | Run API unit tests (no DB required)          |
| `pnpm --filter api run test:watch`       | Run API tests in watch mode                  |
| `pnpm --filter api run migrate:generate` | Generate migration files from schema changes |

## Environment variables

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

## Access protection

Both protections are opt-in — omitting the env vars leaves the app fully open, which is fine for local development or trusted internal networks.

### Dashboard password

Set `DASHBOARD_PASSWORD` in `apps/web` to gate the entire dashboard behind a login page. Visitors who aren't authenticated are redirected to `/login` before they can access any page.

```bash
# apps/web/.env.local
DASHBOARD_PASSWORD=your-password
```

### API key

Set `API_KEY` in `apps/api` to require an `Authorization: Bearer <key>` header on all endpoints except `GET /:slug` (the public redirect). Without it, anyone with network access to the API can create or delete URLs.

```bash
# apps/api/.env.local
API_KEY=your-api-key
```

Set the matching value in `apps/web` so the dashboard can still talk to the API:

```bash
# apps/web/.env.local
API_KEY=your-api-key   # must match the value above
```

### Using both together

For a fully locked-down self-hosted instance, set all three variables:

```bash
# apps/api/.env.local
API_KEY=your-api-key

# apps/web/.env.local
DASHBOARD_PASSWORD=your-dashboard-password
API_KEY=your-api-key
```

The dashboard password protects the web UI; the API key protects the API itself from direct access via cURL or other HTTP clients.

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

| Column       | Type      | Notes                             |
| ------------ | --------- | --------------------------------- |
| `id`         | uuid      | Primary key                       |
| `url_id`     | uuid      | FK → urls.id (cascade delete)     |
| `clicked_at` | timestamp | Default now                       |
| `ip_hash`    | text      | HMAC-SHA-256 hash of IP, nullable |
| `user_agent` | text      | Nullable                          |
| `referer`    | text      | Nullable                          |
