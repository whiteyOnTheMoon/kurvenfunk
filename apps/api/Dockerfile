FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api

RUN pnpm --filter api build


FROM node:24-alpine AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install \
    --frozen-lockfile \
    --prod \
    --filter api...

COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
