# API Server

Standalone REST backend for authentication and account/session operations.

## Stack

- Fastify
- Zod validation
- JWT auth tokens
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

## Development

```bash
pnpm install
pnpm dev
```

Runs on `http://localhost:4000` by default.
