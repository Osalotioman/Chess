# syntax=docker/dockerfile:1

# 1. Base Stage: System dependencies only
FROM php:8.3-cli-alpine AS base
WORKDIR /app
RUN docker-php-ext-install sockets
# Create a non-privileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 2. Builder Stage: Composer dependencies
FROM composer:2 AS builder
WORKDIR /app
COPY composer.json composer.lock ./
# Install production dependencies and optimize
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

# 3. Final Production Stage
FROM base AS prod
# Copy vendor from builder and source from host
COPY --from=builder --chown=appuser:appgroup /app/vendor /app/vendor
COPY --chown=appuser:appgroup src /app/src

# Run as non-root user
USER appuser

ENV WS_HOST=0.0.0.0 \
    WS_PORT=8080

EXPOSE 8080
CMD ["php", "src/server.php"]