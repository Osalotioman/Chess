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
  if (trimmed.length < 3 || trimmed.length > 128) return false;
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
  const preferredSeat =
    value.preferredSeat === "white" || value.preferredSeat === "black"
      ? value.preferredSeat
      : value.preferredSeat === "spectator"
        ? "spectator"
        : undefined;

  const normalizedMode = mode === "account" && userId && userId.length > 0 ? "account" : "guest";

  return {
    mode: normalizedMode,
    guestId: guestId && guestId.length > 0 ? guestId : undefined,
    guestName: guestName && guestName.length > 0 ? guestName : undefined,
    userId: userId && userId.length > 0 ? userId : undefined,
    username: username && username.length > 0 ? username : undefined,
    preferredSeat,
  };
}

async function handleJsonMessage(
  roomRegistry: RoomRegistry,
  ws: WebSocket,
  obj: unknown,
  onRoomJoin?: (room: string) => void
) {
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
        message: "Invalid room. Use 3-128 chars: letters, digits, _ or -",
      });
      return;
    }

    const normalizedRoom = room.trim();
    const player = normalizePlayerIdentity(obj.player);
    const joinedRoom = roomRegistry.join(ws, normalizedRoom, player);
    if (joinedRoom.left && joinedRoom.left.peers > 0) {
      broadcast(roomRegistry, joinedRoom.left.room, ws, {
        type: "peer_left",
        peers: joinedRoom.left.peers,
      });
    }

    send(ws, {
      type: "joined",
      room: normalizedRoom,
      peers: joinedRoom.peers,
      player,
      seat: joinedRoom.seat,
      turn: joinedRoom.turn,
      moves: joinedRoom.moves,
    });

    if (joinedRoom.joined) {
      broadcast(roomRegistry, normalizedRoom, ws, {
        type: "peer_joined",
        peers: joinedRoom.peers,
        player,
        seat: joinedRoom.seat,
      });
      onRoomJoin?.(normalizedRoom);
    }
    return;
  }

  if (type === "move") {
    const room = roomRegistry.getRoom(ws);
    if (!room) {
      send(ws, { type: "error", message: "Join a room first" });
      return;
    }

    const player = roomRegistry.getPlayer(ws);

    const seat = roomRegistry.getSeat(ws);
    if (seat === "spectator") {
      send(ws, { type: "error", message: "Spectators cannot make moves" });
      return;
    }

    if (!(player.mode === "account" && player.userId)) {
      const currentTurn = roomRegistry.getTurn(room);
      if (currentTurn !== seat) {
        send(ws, { type: "error", message: `It is ${currentTurn}'s turn` });
        return;
      }
    }

    const from = normalizeMoveField(obj.from);
    const to = normalizeMoveField(obj.to);
    const promotion = typeof obj.promotion === "string" ? obj.promotion : undefined;

    if (!from || !to) {
      send(ws, { type: "error", message: "Invalid move" });
      return;
    }

    if (!internalWsSharedSecret) {
      roomRegistry.recordMove(room, { from, to, promotion }, seat === "white" ? "black" : "white");
      broadcast(roomRegistry, room, ws, {
        type: "move",
        from,
        to,
        promotion,
        turn: roomRegistry.getTurn(room),
      });
      return;
    }

    if (player.mode === "account" && player.userId) {
      let authorization;
      try {
        authorization = await authorizeAndAdvanceMove(
          apiServerOrigin,
          internalWsSharedSecret,
          room,
          player,
          { from, to, promotion }
        );
      } catch {
        send(ws, { type: "error", message: "Move verification request failed" });
        return;
      }

      if (!authorization.ok) {
        send(ws, { type: "error", message: authorization.reason ?? "Move not authorized" });
        return;
      }

      roomRegistry.recordMove(room, { from, to, promotion }, authorization.nextTurn);
      broadcast(roomRegistry, room, ws, {
        type: "move",
        from,
        to,
        promotion,
        turn: roomRegistry.getTurn(room),
      });
      return;
    }

    roomRegistry.recordMove(room, { from, to, promotion }, seat === "white" ? "black" : "white");
    broadcast(roomRegistry, room, ws, {
      type: "move",
      from,
      to,
      promotion,
      turn: roomRegistry.getTurn(room),
    });
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

export async function handleIncomingMessage(
  roomRegistry: RoomRegistry,
  ws: WebSocket,
  raw: string,
  onRoomJoin?: (room: string) => void
) {
  const parsed = safeJsonParse(raw);
  if (parsed !== undefined) {
    await handleJsonMessage(roomRegistry, ws, parsed, onRoomJoin);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Message not safely parsed, handling as legacy");
  handleLegacyMessage(roomRegistry, ws, raw);
}
