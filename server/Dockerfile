# syntax=docker/dockerfile:1

# 1. Base Stage: System dependencies only
FROM php:8.3-cli-alpine AS base
WORKDIR /app
RUN set -eux; \
        for attempt in 1 2 3; do \
            docker-php-ext-install sockets && break; \
            if [ "$attempt" -eq 3 ]; then exit 1; fi; \
            sleep 5; \
        done
# Create a non-privileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 2. Builder Stage: Composer dependencies (production)
FROM composer:2 AS deps-prod
WORKDIR /app
COPY composer.json composer.lock ./
# Install production dependencies and optimize
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

# 3. Builder Stage: Composer dependencies (development/tests)
FROM composer:2 AS deps-dev
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --prefer-dist --no-interaction --no-progress

# 4. Final Production Stage
FROM base AS prod
# Copy vendor from prod deps and source from build context
COPY --from=deps-prod --chown=appuser:appgroup /app/vendor /app/vendor
COPY --chown=appuser:appgroup composer.json composer.lock /app/
COPY --chown=appuser:appgroup src /app/src

# Run as non-root user
USER appuser

ENV WS_HOST=0.0.0.0 \
    WS_PORT=8080

EXPOSE 8080
CMD ["php", "src/server.php"]

# 5. Development/Test Stage
FROM base AS dev
COPY --from=deps-dev --chown=appuser:appgroup /app/vendor /app/vendor
COPY --chown=appuser:appgroup composer.json composer.lock phpunit.xml /app/
COPY --chown=appuser:appgroup src /app/src
COPY --chown=appuser:appgroup tests /app/tests
USER appuser