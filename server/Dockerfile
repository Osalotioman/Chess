FROM composer:2 AS deps
WORKDIR /app

COPY composer.json composer.lock ./
COPY src/ ./src/

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

RUN useradd appuser
USER appuser

ENV WS_HOST=0.0.0.0 \
    WS_PORT=8080 \
    APP_ENV=production

EXPOSE 8080

CMD ["composer", "start"]