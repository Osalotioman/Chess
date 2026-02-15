# syntax=docker/dockerfile:1.7

############################
# 1) Dependencies builder
############################
FROM composer:2 AS deps
WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --classmap-authoritative

############################
# 2) Production runtime
############################
FROM php:8.3-cli-alpine AS prod
WORKDIR /app

# Build/enable required PHP extensions, then clean build deps.
RUN set -eux; \
    apk add --no-cache --virtual .build-deps $PHPIZE_DEPS; \
    docker-php-ext-install sockets; \
    apk del --no-network .build-deps

# Create non-root runtime user/group with deterministic IDs.
ARG APP_UID=10001
ARG APP_GID=10001
RUN addgroup -g ${APP_GID} -S appgroup \
    && adduser -u ${APP_UID} -S -D -G appgroup appuser

# Copy only runtime artifacts.
COPY --from=deps --chown=appuser:appgroup /app/vendor /app/vendor
COPY --chown=appuser:appgroup composer.json composer.lock /app/
COPY --chown=appuser:appgroup src /app/src

ENV WS_HOST=0.0.0.0 \
    WS_PORT=8080 \
    APP_ENV=production

EXPOSE 8080

USER appuser

CMD ["php", "src/server.php"]