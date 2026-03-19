import type { WebSocket } from "ws";

import { apiServerOrigin, internalWsSharedSecret } from "../config.js";
import type { PlayerIdentity } from "../protocol.js";
import { RoomRegistry } from "../rooms/roomRegistry.js";
import { authorizeAndAdvanceMove } from "../services/internalApi.js";
import { broadcast, send } from "./socketMessaging.js";

type MoveInput = {
  from: string;
  to: string;
  promotion?: string;
};

function broadcastMove(roomRegistry: RoomRegistry, ws: WebSocket, room: string, move: MoveInput) {
  broadcast(roomRegistry, room, ws, {
    type: "move",
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    turn: roomRegistry.getTurn(room),
  });
}

function canGuestMove(roomRegistry: RoomRegistry, room: string, seat: "white" | "black") {
  const currentTurn = roomRegistry.getTurn(room);
  return currentTurn === seat;
}

async function authorizeAccountMove(
  room: string,
  player: PlayerIdentity,
  move: MoveInput
) {
  return authorizeAndAdvanceMove(apiServerOrigin, internalWsSharedSecret, room, player, move);
}

export async function handleMoveMessage(
  roomRegistry: RoomRegistry,
  ws: WebSocket,
  player: PlayerIdentity,
  move: MoveInput
) {
  const room = roomRegistry.getRoom(ws);
  if (!room) {
    send(ws, { type: "error", message: "Join a room first" });
    return;
  }

  const seat = roomRegistry.getSeat(ws);
  if (seat === "spectator") {
    send(ws, { type: "error", message: "Spectators cannot make moves" });
    return;
  }

  if (!(player.mode === "account" && player.userId) && !canGuestMove(roomRegistry, room, seat)) {
    send(ws, { type: "error", message: `It is ${roomRegistry.getTurn(room)}'s turn` });
    return;
  }

  if (!internalWsSharedSecret) {
    roomRegistry.recordMove(room, move, seat === "white" ? "black" : "white");
    broadcastMove(roomRegistry, ws, room, move);
    return;
  }

  if (player.mode === "account" && player.userId) {
    let authorization;
    try {
      authorization = await authorizeAccountMove(room, player, move);
    } catch {
      send(ws, { type: "error", message: "Move verification request failed" });
      return;
    }

    if (!authorization.ok) {
      send(ws, { type: "error", message: authorization.reason ?? "Move not authorized" });
      return;
    }

    roomRegistry.recordMove(room, move, authorization.nextTurn);
    broadcastMove(roomRegistry, ws, room, move);
    return;
  }

  roomRegistry.recordMove(room, move, seat === "white" ? "black" : "white");
  broadcastMove(roomRegistry, ws, room, move);
}
