FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/logger/package.json ./packages/logger/package.json

RUN pnpm install --frozen-lockfile --filter worker...

COPY apps/worker ./apps/worker
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/logger ./packages/logger

RUN pnpm --filter @kurvenfunk/logger build
RUN pnpm --filter worker build


FROM node:24-alpine AS production

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/logger/package.json ./packages/logger/package.json

RUN pnpm install \
    --frozen-lockfile \
    --prod \
    --filter worker...

COPY packages/types ./packages/types
COPY packages/config ./packages/config

COPY --from=build /app/packages/logger/dist ./packages/logger/dist
COPY --from=build /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker

CMD ["node", "dist/main.js"]
