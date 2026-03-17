FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

FROM base AS install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
RUN pnpm install --frozen-lockfile

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=install /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

WORKDIR /app/packages/server
EXPOSE 9527
CMD ["bun", "src/index.ts"]
