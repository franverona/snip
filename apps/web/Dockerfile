FROM node:22-alpine AS base
RUN corepack enable pnpm

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
WORKDIR /app
# Install dependencies (source is mounted as a volume at runtime)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "--filter", "web", "dev"]

# ── build ─────────────────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
COPY packages ./packages
COPY tsconfig.json ./
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @snip/types build
RUN pnpm --filter web build

# ── prod ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS prod
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
CMD ["pnpm", "--filter", "web", "start"]
