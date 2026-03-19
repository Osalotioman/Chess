# Chess Client

The frontend for the Chess platform. This app is where players:

- Enter the arena for real-time games.
- Discover players and manage social actions in the lobby.
- Create and accept invite links.
- Play as guest today, with account-backed flows expanding.

Built with Next.js App Router and wired to both REST and WebSocket backends.

## Local Setup

Run the dependent services first:

- `api-server` on `http://localhost:4000`
- `ws-server` on `ws://localhost:8080`

Then in `client/`:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Set these in `.env.local` (or `.env`):

```bash
# Browser-visible websocket endpoint used by the arena
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Server-side upstream used by app/api proxy route
REST_BACKEND_ORIGIN=http://localhost:4000
```

## Networking Model

The client intentionally uses a split transport model:

- WebSocket: direct browser connection to `NEXT_PUBLIC_WS_URL`
- REST: client calls `/api/*`, and `app/api/[...path]/route.ts` forwards to `REST_BACKEND_ORIGIN`

Why this exists:

- Keeps browser code stable (`/api/*`) while allowing backend origin changes per environment.
- Avoids fragile websocket rewrite behavior in Next config.

Use `app/lib/api.ts` for REST requests so headers, errors, and base path behavior stay consistent.

## App Surfaces

- `/`: product landing page
- `/lobby`: player discovery, friend requests, invite creation
- `/arena`: websocket gameplay, room join, invite accept, identity mode controls
- `/settings`: board/sound/UX preferences

## Auth and Identity

- Auth API helpers: `app/lib/auth.ts`
- Token/session helpers: `app/lib/session.ts`
- Guest/account mode state: `app/lib/usePlayerIdentity.ts`

Current product behavior:

- Guests can play immediately.
- Account routes power social and signed invite actions.

## Development Notes

- If REST calls fail in the UI, verify `REST_BACKEND_ORIGIN` and that `api-server` is running.
- If real-time updates fail, verify `NEXT_PUBLIC_WS_URL` and that `ws-server` is running.
- For social and invite endpoints, ensure Prisma migrations in `api-server` are applied.
