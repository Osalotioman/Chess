import type { WebSocket } from "ws";
import { Chess } from "chess.js";

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

function broadcastMove(roomRegistry: RoomRegistry, room: string, move: MoveInput) {
  broadcast(roomRegistry, room, null, {
    type: "move",
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    turn: roomRegistry.getTurn(room),
  });
}

function parsePromotion(promotion?: string): "q" | "r" | "b" | "n" | undefined {
  if (!promotion) return undefined;
  const normalized = promotion.trim().toLowerCase();
  if (normalized === "q" || normalized === "r" || normalized === "b" || normalized === "n") {
    return normalized;
  }
  return undefined;
}

function validateMoveAgainstServerState(
  roomRegistry: RoomRegistry,
  room: string,
  seat: "white" | "black",
  move: MoveInput
): { ok: true; nextTurn: "white" | "black"; normalizedPromotion?: "q" | "r" | "b" | "n" } | { ok: false; reason: string } {
  const chess = new Chess();
  const moves = roomRegistry.getMoves(room);

  for (const previousMove of moves) {
    try {
      const applied = chess.move(
        previousMove.promotion
          ? {
              from: previousMove.from,
              to: previousMove.to,
              promotion: previousMove.promotion,
            }
          : {
              from: previousMove.from,
              to: previousMove.to,
            }
      );
      if (!applied) {
        return { ok: false, reason: "Game state is out of sync on server" };
      }
    } catch {
      return { ok: false, reason: "Game state is out of sync on server" };
    }
  }

  const expectedSeat = chess.turn() === "w" ? "white" : "black";
  if (seat !== expectedSeat) {
    return { ok: false, reason: `It is ${expectedSeat}'s turn` };
  }

  const normalizedPromotion = parsePromotion(move.promotion);
  if (move.promotion && !normalizedPromotion) {
    return { ok: false, reason: "Invalid promotion piece" };
  }

  try {
    const applied = chess.move(
      normalizedPromotion
        ? { from: move.from, to: move.to, promotion: normalizedPromotion }
        : { from: move.from, to: move.to }
    );

    if (!applied) {
      return { ok: false, reason: "Illegal move" };
    }
  } catch {
    return { ok: false, reason: "Illegal move" };
  }

  return {
    ok: true,
    nextTurn: chess.turn() === "w" ? "white" : "black",
    normalizedPromotion,
  };
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

  const legality = validateMoveAgainstServerState(roomRegistry, room, seat, move);
  if (!legality.ok) {
    send(ws, { type: "error", message: legality.reason });
    return;
  }

  const normalizedMove = {
    ...move,
    ...(legality.normalizedPromotion ? { promotion: legality.normalizedPromotion } : {}),
  };

  if (!internalWsSharedSecret) {
    roomRegistry.recordMove(room, normalizedMove, legality.nextTurn);
    broadcastMove(roomRegistry, room, normalizedMove);
    return;
  }

  if (player.mode === "account" && player.userId) {
    let authorization;
    try {
      authorization = await authorizeAccountMove(room, player, normalizedMove);
    } catch {
      send(ws, { type: "error", message: "Move verification request failed" });
      return;
    }

    if (!authorization.ok) {
      send(ws, { type: "error", message: authorization.reason ?? "Move not authorized" });
      return;
    }

    roomRegistry.recordMove(room, normalizedMove, authorization.nextTurn);
    broadcastMove(roomRegistry, room, normalizedMove);
    return;
  }

  roomRegistry.recordMove(room, normalizedMove, legality.nextTurn);
  broadcastMove(roomRegistry, room, normalizedMove);
}
