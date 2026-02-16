# Chess

Modern Chess is a two-player chess experience with a Next.js frontend and a PHP WebSocket server for real-time multiplayer. The repository also includes the legacy HTML/CSS/JS implementation for reference.

## Repository Structure

- [client/](client) — Next.js frontend (App Router)
- [server/](server) — PHP WebSocket server (Ratchet)
- [original/](original) — legacy static version and historical docs

## Quick Start

### Frontend (Next.js)

1. Install dependencies:
   - From [client/](client):
     - `pnpm install` (recommended)
     - or `npm install`
2. Start the dev server:
   - `pnpm dev` or `npm run dev`
3. Open http://localhost:3000

### WebSocket Server (PHP)

1. From [server/](server):
   - `composer install`
   - `composer start`
2. The server listens on ws://localhost:8080 by default.

For Docker and advanced configuration, see [server/README.md](server/README.md).

### Legacy Static Version

The previous HTML/CSS/JS build is kept in [original/](original). You can open the static pages in [original/html/](original/html) with any static file server.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [original/docs/CHANGELOG.md](original/docs/CHANGELOG.md)
- [original/docs/USER_GUIDE.md](original/docs/USER_GUIDE.md)
- [original/docs/API.md](original/docs/API.md)
- [original/docs/DEPLOYMENT.md](original/docs/DEPLOYMENT.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
