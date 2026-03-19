<div align="center">

<img src="./screenshots/logo.svg" alt="Snip logo" width="120" />

<h3>Snip</h3>

[![CI](https://github.com/franverona/snip/actions/workflows/ci.yml/badge.svg)](https://github.com/franverona/snip/actions/workflows/ci.yml)

A self-hosted URL shortener that turns long, unwieldy links into clean and shareable slugs.

</div>

## Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Monorepo     | Turborepo + pnpm workspaces                             |
| Backend      | Fastify, Drizzle ORM, PostgreSQL                        |
| Frontend     | Next.js 15 (App Router), styled-components              |
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

### 6. Start development servers

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
| `pnpm seed`                              | Seed the DB with sample URLs and clicks      |
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
