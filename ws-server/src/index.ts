import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type JoinMessage = { type: "join"; room: string };

type MoveMessage = {
  type: "move";
  from: string;
  to: string;
  promotion?: string;
};

type ClientMessage = JoinMessage | MoveMessage;

type ServerMessage =
  | { type: "joined"; room: string; peers: number }
  | { type: "peer_joined"; peers: number }
  | { type: "peer_left"; peers: number }
  | ({ type: "move" } & Omit<MoveMessage, "type">)
  | { type: "error"; message: string };

type RoomId = string;

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8080);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        uptimeSec: Math.round(process.uptime()),
        rooms: rooms.size,
        clients: wss.clients.size,
      })
    );
    return;
  }

  res.writeHead(200, { "content-type": "text/plain" });
  res.end("OK\n");
});

const wss = new WebSocketServer({ server });

const rooms = new Map<RoomId, Set<WebSocket>>();
const socketRoom = new WeakMap<WebSocket, RoomId>();

function safeJsonParse(raw: string): Json | undefined {
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function broadcast(room: RoomId, except: WebSocket | null, msg: ServerMessage) {
  const peers = rooms.get(room);
  if (!peers) return;
  const payload = JSON.stringify(msg);
  for (const peer of peers) {
    if (except && peer === except) continue;
    if (peer.readyState !== peer.OPEN) continue;
    peer.send(payload);
  }
}

function joinRoom(ws: WebSocket, room: RoomId) {
  const prev = socketRoom.get(ws);
  if (prev) {
    if (prev === room) return;
    leaveRoom(ws, prev);
  }

  const set = rooms.get(room) ?? new Set<WebSocket>();
  set.add(ws);
  rooms.set(room, set);
  socketRoom.set(ws, room);

  send(ws, { type: "joined", room, peers: set.size });
  broadcast(room, ws, { type: "peer_joined", peers: set.size });
}

function leaveRoom(ws: WebSocket, room: RoomId) {
  const set = rooms.get(room);
  if (!set) return;
  set.delete(ws);
  socketRoom.delete(ws);
  if (set.size === 0) {
    rooms.delete(room);
    return;
  }
  broadcast(room, ws, { type: "peer_left", peers: set.size });
}

function getRoom(ws: WebSocket): RoomId | undefined {
  return socketRoom.get(ws);
}

function isValidRoom(room: string): boolean {
  const trimmed = room.trim();
  if (trimmed.length < 1 || trimmed.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

function normalizeMoveField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (v.length < 1 || v.length > 4) return null;
  return v;
}

function handleJsonMessage(ws: WebSocket, obj: unknown) {
  if (!isRecord(obj)) {
    send(ws, { type: "error", message: "Invalid message" });
    return;
  }

  const type = obj.type;
  if (type === "join") {
    const room = typeof obj.room === "string" ? obj.room : "";
    if (!isValidRoom(room)) {
      send(ws, {
        type: "error",
        message: "Invalid room. Use 1-64 chars: letters, digits, _ or -",
      });
      return;
    }
    joinRoom(ws, room.trim());
    return;
  }

  if (type === "move") {
    const room = getRoom(ws);
    if (!room) {
      send(ws, { type: "error", message: "Join a room first" });
      return;
    }

    const from = normalizeMoveField(obj.from);
    const to = normalizeMoveField(obj.to);
    const promotion = typeof obj.promotion === "string" ? obj.promotion : undefined;

    if (!from || !to) {
      send(ws, { type: "error", message: "Invalid move" });
      return;
    }

    broadcast(room, ws, { type: "move", from, to, promotion });
    return;
  }

  send(ws, { type: "error", message: "Unknown message type" });
}

function handleLegacyMessage(ws: WebSocket, raw: string) {
  // Legacy protocol support: the old PHP server relayed arbitrary strings (often "11" coords).
  // We keep it permissive: if a client joined a room, broadcast raw strings as-is.
  const room = getRoom(ws);
  if (!room) {
    send(ws, { type: "error", message: "Join a room first" });
    return;
  }

  const peers = rooms.get(room);
  if (!peers) return;
  for (const peer of peers) {
    if (peer === ws) continue;
    if (peer.readyState !== peer.OPEN) continue;
    peer.send(raw);
  }
}

wss.on("connection", (ws, req) => {
  // Minimal logging; keep it stable for systemd/docker.
  const ip = req.socket.remoteAddress ?? "unknown";
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] connected ${ip}`);

  ws.on("message", (data) => {
    const raw = typeof data === "string" ? data : data.toString("utf8");
    const parsed = safeJsonParse(raw);
    if (parsed !== undefined) {
      handleJsonMessage(ws, parsed);
      return;
    }

    handleLegacyMessage(ws, raw);
  });

  ws.on("close", () => {
    const room = getRoom(ws);
    if (room) leaveRoom(ws, room);
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] disconnected ${ip}`);
  });

  ws.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] ws error`, err);
  });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] WS listening on ws://${host}:${port}`);
});
