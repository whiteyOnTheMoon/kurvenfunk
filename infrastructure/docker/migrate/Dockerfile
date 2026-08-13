FROM node:24-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/package.json

RUN pnpm install \
    --frozen-lockfile \
    --filter @kurvenfunk/database...

COPY packages/database ./packages/database

WORKDIR /app/packages/database

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]
