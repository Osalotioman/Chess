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

RUN set -eux; \
    apk add --no-cache --virtual .build-deps $PHPIZE_DEPS linux-headers; \
    docker-php-ext-install sockets; \
    apk del .build-deps

ARG APP_UID=10001
ARG APP_GID=10001

RUN addgroup -S -g ${APP_GID} appgroup \
    && adduser -S -D -u ${APP_UID} -G appgroup appuser

COPY --from=deps --chown=appuser:appgroup /app/vendor ./vendor
COPY --chown=appuser:appgroup composer.json composer.lock ./
COPY --chown=appuser:appgroup src ./src

ENV WS_HOST=0.0.0.0 \
    WS_PORT=8080 \
    APP_ENV=production

EXPOSE 8080

USER appuser

CMD ["composer", "start"]