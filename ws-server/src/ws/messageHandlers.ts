import type { WebSocket } from "ws";

import type { Json, PlayerIdentity } from "../protocol.js";
import { apiServerOrigin, internalWsSharedSecret } from "../config.js";
import { RoomRegistry } from "../rooms/roomRegistry.js";
import { authorizeAndAdvanceMove } from "../services/internalApi.js";
import { broadcast, broadcastRaw, send } from "./socketMessaging.js";

function safeJsonParse(raw: string): Json | undefined {
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRoom(room: string): boolean {
  const trimmed = room.trim();
  if (trimmed.length < 1 || trimmed.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

function normalizeMoveField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalizedValue = value.trim();
  if (normalizedValue.length < 1 || normalizedValue.length > 4) return null;
  return normalizedValue;
}

function normalizePlayerIdentity(value: unknown): PlayerIdentity {
  if (!isRecord(value)) {
    return { mode: "guest" };
  }

  const mode = value.mode === "account" ? "account" : "guest";
  const guestId = typeof value.guestId === "string" ? value.guestId.trim().slice(0, 64) : undefined;
  const guestName =
    typeof value.guestName === "string" ? value.guestName.trim().slice(0, 32) : undefined;
  const userId = typeof value.userId === "string" ? value.userId.trim().slice(0, 64) : undefined;
  const username = typeof value.username === "string" ? value.username.trim().slice(0, 32) : undefined;

  return {
    mode,
    guestId: guestId && guestId.length > 0 ? guestId : undefined,
    guestName: guestName && guestName.length > 0 ? guestName : undefined,
    userId: userId && userId.length > 0 ? userId : undefined,
    username: username && username.length > 0 ? username : undefined,
  };
}

async function handleJsonMessage(roomRegistry: RoomRegistry, ws: WebSocket, obj: unknown) {
  if (!isRecord(obj)) {
    // eslint-disable-next-line no-console
    console.log("This message is not a record:", obj);
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

    const normalizedRoom = room.trim();
    const player = normalizePlayerIdentity(obj.player);
    const joinedRoom = roomRegistry.join(ws, normalizedRoom, player);
    if (!joinedRoom.joined) {
      return;
    }

    if (joinedRoom.left && joinedRoom.left.peers > 0) {
      broadcast(roomRegistry, joinedRoom.left.room, ws, {
        type: "peer_left",
        peers: joinedRoom.left.peers,
      });
    }

    send(ws, { type: "joined", room: normalizedRoom, peers: joinedRoom.peers, player });
    broadcast(roomRegistry, normalizedRoom, ws, {
      type: "peer_joined",
      peers: joinedRoom.peers,
      player,
    });
    return;
  }

  if (type === "move") {
    const room = roomRegistry.getRoom(ws);
    if (!room) {
      send(ws, { type: "error", message: "Join a room first" });
      return;
    }

    if (!internalWsSharedSecret) {
      send(ws, { type: "error", message: "Move verification unavailable on server" });
      return;
    }

    const from = normalizeMoveField(obj.from);
    const to = normalizeMoveField(obj.to);
    const promotion = typeof obj.promotion === "string" ? obj.promotion : undefined;

    if (!from || !to) {
      send(ws, { type: "error", message: "Invalid move" });
      return;
    }

    const player = roomRegistry.getPlayer(ws);
    let authorization;
    try {
      authorization = await authorizeAndAdvanceMove(
        apiServerOrigin,
        internalWsSharedSecret,
        room,
        player
      );
    } catch {
      send(ws, { type: "error", message: "Move verification request failed" });
      return;
    }

    if (!authorization.ok) {
      send(ws, { type: "error", message: authorization.reason ?? "Move not authorized" });
      return;
    }

    broadcast(roomRegistry, room, ws, { type: "move", from, to, promotion });
    return;
  }

  send(ws, { type: "error", message: "Unknown message type" });
}

function handleLegacyMessage(roomRegistry: RoomRegistry, ws: WebSocket, raw: string) {
  // Legacy protocol support: old clients sent arbitrary strings and expected pass-through relay.
  const room = roomRegistry.getRoom(ws);
  if (!room) {
    send(ws, { type: "error", message: "Join a room first" });
    return;
  }

  broadcastRaw(roomRegistry, room, ws, raw);
}

export async function handleIncomingMessage(roomRegistry: RoomRegistry, ws: WebSocket, raw: string) {
  const parsed = safeJsonParse(raw);
  if (parsed !== undefined) {
    await handleJsonMessage(roomRegistry, ws, parsed);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Message not safely parsed, handling as legacy");
  handleLegacyMessage(roomRegistry, ws, raw);
}
