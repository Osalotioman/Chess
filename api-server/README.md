# API Server

Standalone REST backend for authentication and account/session operations.

## Stack

- Fastify
- Zod validation
- JWT auth tokens
- Prisma ORM + Prisma Migrate
- PostgreSQL
- TypeScript

## Endpoints

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me` (Bearer token)
- `DELETE /auth/logout`

## Environment

Copy `.env.example` to `.env` and set secure secrets.

Prisma 7 datasource URLs are configured via `prisma.config.ts` (not in `schema.prisma`).

`SHADOW_DATABASE_URL` is used by Prisma during `prisma migrate dev` to safely diff schemas without mutating your main development database.

## Migrations

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
```

For production deploys:

```bash
pnpm prisma:migrate:deploy
```

## Development

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm dev
```

Runs on `http://localhost:4000` by default.
