import type { WebSocket } from "ws";

import type { Json } from "../protocol.js";
import { RoomRegistry } from "../rooms/roomRegistry.js";
import { handleMoveMessage } from "./handleMoveMessage.js";
import {
  isRecord,
  isValidRoom,
  normalizeMoveField,
  normalizePlayerIdentity,
  safeJsonParse,
} from "./messageValidation.js";
import { broadcast, broadcastRaw, send } from "./socketMessaging.js";

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
    const player = roomRegistry.getPlayer(ws);

    const from = normalizeMoveField(obj.from);
    const to = normalizeMoveField(obj.to);
    const promotion = typeof obj.promotion === "string" ? obj.promotion : undefined;

    if (!from || !to) {
      send(ws, { type: "error", message: "Invalid move" });
      return;
    }

    await handleMoveMessage(roomRegistry, ws, player, { from, to, promotion });
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
