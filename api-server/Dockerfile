# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.15.6 --activate

COPY package.json ./
RUN pnpm install


FROM node:22-alpine AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.15.6 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build


FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.15.6 --activate

COPY package.json ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist

ARG APP_UID=10001
ARG APP_GID=10001

RUN addgroup -S -g ${APP_GID} appgroup \
	&& adduser -S -D -u ${APP_UID} -G appgroup appuser \
	&& mkdir -p /pnpm \
	&& chown -R appuser:appgroup /app /pnpm

EXPOSE 4000
ENV HOST=0.0.0.0
ENV PORT=4000

USER appuser

CMD ["pnpm", "start"]
