FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/validation/package.json ./packages/validation/package.json

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/logger ./packages/logger
COPY packages/database ./packages/database
COPY packages/validation ./packages/validation

RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    pnpm --filter @kurvenfunk/database generate
RUN pnpm --filter @kurvenfunk/database build
RUN pnpm --filter @kurvenfunk/types build
RUN pnpm --filter @kurvenfunk/logger build
RUN pnpm --filter @kurvenfunk/validation build
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
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/validation/package.json ./packages/validation/package.json

RUN pnpm install \
    --frozen-lockfile \
    --prod \
    --filter api...

COPY packages/config ./packages/config
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/database/package.json ./packages/database/package.json
COPY --from=build /app/packages/database/dist ./packages/database/dist

COPY --from=build /app/packages/logger/dist ./packages/logger/dist
COPY --from=build /app/packages/validation/package.json ./packages/validation/package.json
COPY --from=build /app/packages/validation/dist ./packages/validation/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
