# syntax=docker/dockerfile:1
# Monolithic "full stack" image (ws-server + Next client) in a single container.
# Prefer docker-compose.yml at repo root for a cleaner two-container setup.

FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.15.6 --activate

# --- Build ws-server ---
WORKDIR /app/ws-server
COPY ws-server/package.json ws-server/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY ws-server/ ./
RUN pnpm build
RUN pnpm install --prod --frozen-lockfile

# --- Build client ---
WORKDIR /app/client
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ ./
RUN pnpm build
RUN pnpm install --prod --frozen-lockfile


FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.15.6 --activate

WORKDIR /app
COPY --from=build /app/ws-server ./ws-server
COPY --from=build /app/client ./client

ARG APP_UID=10001
ARG APP_GID=10001

RUN addgroup -S -g ${APP_GID} appgroup \
	&& adduser -S -D -u ${APP_UID} -G appgroup appuser \
	&& mkdir -p /pnpm \
	&& chown -R appuser:appgroup /app /pnpm

EXPOSE 8080
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=8080
ENV CLIENT_PORT=3000

USER appuser

CMD ["sh", "-c", "node /app/ws-server/dist/index.js & cd /app/client && PORT=$CLIENT_PORT pnpm start -- -p $CLIENT_PORT"]
