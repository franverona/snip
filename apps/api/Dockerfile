FROM node:22-alpine AS base
RUN corepack enable pnpm

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
WORKDIR /app
# Install dependencies (source is mounted as a volume at runtime)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "--filter", "api", "dev"]

# ── build ─────────────────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.json ./
RUN pnpm --filter @snip/types build
RUN pnpm --filter api build

# ── prod ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS prod
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/types/dist ./packages/types/dist
CMD ["node", "apps/api/dist/index.js"]
