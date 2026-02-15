# Chess WebSocket Server (PHP)

This folder contains the PHP WebSocket server used by the Chess frontend.

## Run locally (no Docker)

```bash
cd server
composer install
composer start
```

Environment variables:

- `WS_HOST` (default: `0.0.0.0`)
- `WS_PORT` (default: `8080`)

Example:

```bash
WS_HOST=127.0.0.1 WS_PORT=5050 composer start
```

## Run with Docker (development)

From the `server` folder:

```bash
cd server
docker compose up --build
```

This exposes the server on `ws://localhost:8080`.

## Docker image (production)

Build the production target:

```bash
docker build -f server/Dockerfile --target prod -t chess-ws:prod .
```

Or from inside `server`:

```bash
docker build --target prod -t chess-ws:prod .
```

Run it:

```bash
docker run --rm -p 8080:8080 -e WS_HOST=0.0.0.0 -e WS_PORT=8080 chess-ws:prod
```

## Message protocol

The current frontend sends raw messages and the server simply relays them to other clients:

- Moves: two digits like `"34"` (file + rank)
- Promotions: `"queen"`, `"rook"`, `"bishop"`, `"knight"`

Optionally, you can send JSON messages for room support:

- Join: `{ "type": "join", "room": "my-room" }`
- Ping: `{ "type": "ping" }`
- Broadcast within a room: `{ "type": "move", ... }`, `{ "type": "promote", ... }`, `{ "type": "chat", ... }`

## Code layout

- `src/server.php`: CLI entrypoint that binds the socket and starts Ratchet
- `src/WebSocket/ChessWebSocketServer.php`: WebSocket component (rooms + relay)
- `src/Support/*`: small helpers that are unit-tested

## Tests

```bash
cd server
composer test
```
