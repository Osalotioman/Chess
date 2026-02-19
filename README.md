# Chess

Modern Chess is a two-player chess experience with a Next.js frontend and a Node.js WebSocket server for real-time multiplayer. The repository also includes the legacy HTML/CSS/JS implementation for reference.

A working version of this game can be found here: [https://chess-championship-arena.vercel.app/](https://chess-championship-arena.vercel.app/)

## Repository Structure

- [client/](client) — Next.js frontend (App Router)
- [ws-server/](ws-server) — Node.js WebSocket server (TypeScript, `ws`)

## Quick Start

### Frontend (Next.js)

1. Install dependencies:
   - From [client/](client):
     - `pnpm install` (recommended)
     - or `npm install`
2. Start the dev server:
   - `pnpm dev` or `npm run dev`
3. Open http://localhost:3000

### WebSocket Server (Node.js)

1. Install dependencies:
   - From [ws-server/](ws-server):
     - `pnpm install`
2. Start the server:
   - `pnpm dev` (recommended for development)
   - or `pnpm build && pnpm start`
3. The server listens on ws://localhost:8080 by default.

Health check: http://localhost:8080/health

### Docker (Full Stack)

From the repository root:

- `docker compose up --build`

This starts:
- WebSocket server on `ws://localhost:8080`
- Frontend on http://localhost:3000

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
