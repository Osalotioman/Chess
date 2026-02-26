This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Multiplayer (WebSocket)

Online multiplayer uses the Node WebSocket relay in [ws-server/](../ws-server). By default it listens on `ws://localhost:8080`.

## Environment Configuration

Configure backend upstreams in your frontend environment (for example `.env.local`):

```bash
# Server-side rewrite targets
WS_BACKEND_ORIGIN=ws://localhost:8080
WS_BACKEND_PATH=/
REST_BACKEND_ORIGIN=http://localhost:4000
```

The frontend calls stable app-local paths:

- WebSocket: `/ws`
- REST: `/api/*`

Next.js rewrites proxy these to the configured backend origins.

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
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
