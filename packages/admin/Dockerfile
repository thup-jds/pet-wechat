FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

FROM base AS install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/admin/package.json ./packages/admin/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages/admin/node_modules ./packages/admin/node_modules
COPY --from=install /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY packages/admin ./packages/admin
WORKDIR /app/packages/admin
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/packages/admin/dist /usr/share/nginx/html
COPY packages/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
