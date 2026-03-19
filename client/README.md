This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Multiplayer (WebSocket)

Online multiplayer uses the Node WebSocket relay in [ws-server/](../ws-server). By default it listens on `ws://localhost:8080`.

## Environment Configuration

Configure backend upstreams in your frontend environment (for example `.env.local`):

```bash
# Direct WebSocket endpoint used by the arena client
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Upstream REST API origin used by app/api proxy route
REST_BACKEND_ORIGIN=http://localhost:4000
```

The frontend calls stable app-local paths:

- WebSocket: direct `NEXT_PUBLIC_WS_URL`
- REST: `/api/*` (proxied by `app/api/[...path]/route.ts`)

The REST proxy route forwards all HTTP methods and query strings to `REST_BACKEND_ORIGIN`.

Use `app/lib/api.ts` helpers for frontend REST requests so all calls consistently target the proxied API base path.

## Auth Client Foundation

Frontend auth request helpers are available in `app/lib/auth.ts`:

- `signup`
- `login`
- `refreshSession`
- `getMe`
- `logout`

Client-side auth session persistence helpers are in `app/lib/session.ts`.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
