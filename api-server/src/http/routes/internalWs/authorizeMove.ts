import { Chess } from "chess.js";
import type { PrismaClient } from "../../../db/generated/prisma/client";

type MovePayload = {
  from: string;
  to: string;
  promotion?: string;
};

type AuthorizeMoveInput = {
  roomCode: string;
  userId?: string;
  move?: MovePayload;
};

type AuthorizeMoveResult =
  | { ok: true; enforced: true; seat: "white" | "black"; nextTurn: "white" | "black" }
  | { ok: true; enforced: false; seat: "spectator"; reason: string }
  | { ok: false; enforced: true; seat: "white" | "black" | "spectator"; reason: string };

function seatForUser(game: { whitePlayerId: string | null; blackPlayerId: string | null }, userId: string) {
  if (game.whitePlayerId === userId) return "white" as const;
  if (game.blackPlayerId === userId) return "black" as const;
  return "spectator" as const;
}

export async function authorizeAndPersistMove(
  prismaClient: PrismaClient,
  input: AuthorizeMoveInput
): Promise<AuthorizeMoveResult> {
  return prismaClient.$transaction(async (tx) => {
    const game = await tx.gameSession.findUnique({
      where: { roomCode: input.roomCode },
      select: {
        id: true,
        status: true,
        whitePlayerId: true,
        blackPlayerId: true,
        turnColor: true,
        moveCount: true,
        fen: true,
      },
    });

    if (!game) {
      return { ok: true, enforced: false, seat: "spectator", reason: "No game session for room" };
    }

    if (!input.userId) {
      return {
        ok: false,
        enforced: true,
        seat: "spectator",
        reason: "Authenticated account required for this game room",
      };
    }

    const seat = seatForUser(game, input.userId);

    if (seat === "spectator") {
      return {
        ok: false,
        enforced: true,
        seat,
        reason: "You are not seated in this game",
      };
    }

    if (game.status === "finished" || game.status === "cancelled") {
      return {
        ok: false,
        enforced: true,
        seat,
        reason: "Game is not active",
      };
    }

    if (game.turnColor !== seat) {
      return {
        ok: false,
        enforced: true,
        seat,
        reason: `It is ${game.turnColor}'s turn`,
      };
    }

    const hasMove = Boolean(input.move);
    let nextTurn: "white" | "black" = game.turnColor;
    let nextFen = game.fen;

    if (hasMove && input.move) {
      const historyMoves = await tx.gameMove.findMany({
        where: { gameSessionId: game.id },
        orderBy: { ply: "asc" },
        select: {
          fromSquare: true,
          toSquare: true,
          promotion: true,
        },
      });

      const chess = new Chess();

      for (const historyMove of historyMoves) {
        const applied = chess.move({
          from: historyMove.fromSquare.toLowerCase(),
          to: historyMove.toSquare.toLowerCase(),
          ...(historyMove.promotion ? { promotion: historyMove.promotion.toLowerCase() } : {}),
        });

        if (!applied) {
          return {
            ok: false,
            enforced: true,
            seat,
            reason: "Stored game history is invalid",
          };
        }
      }

      const replayTurn = chess.turn() === "w" ? "white" : "black";
      if (replayTurn !== game.turnColor) {
        return {
          ok: false,
          enforced: true,
          seat,
          reason: "Game state drift detected. Please reconnect.",
        };
      }

      const promotion = input.move.promotion?.toLowerCase();
      const attempted = chess.move({
        from: input.move.from.toLowerCase(),
        to: input.move.to.toLowerCase(),
        ...(promotion ? { promotion } : {}),
      });

      if (!attempted) {
        return {
          ok: false,
          enforced: true,
          seat,
          reason: "Illegal move for current board state",
        };
      }

      nextFen = chess.fen();
      nextTurn = chess.turn() === "w" ? "white" : "black";
    }

    const updated = await tx.gameSession.updateMany({
      where: {
        id: game.id,
        turnColor: seat,
      },
      data: {
        status: "active",
        turnColor: nextTurn,
        fen: nextFen,
        ...(hasMove ? { moveCount: { increment: 1 } } : {}),
      },
    });

    if (updated.count === 0) {
      return {
        ok: false,
        enforced: true,
        seat,
        reason: "Turn changed before move was committed",
      };
    }

    if (hasMove && input.move) {
      await tx.gameMove.create({
        data: {
          gameSessionId: game.id,
          ply: game.moveCount + 1,
          fromSquare: input.move.from,
          toSquare: input.move.to,
          promotion: input.move.promotion,
          seat,
          playerUserId: input.userId,
        },
      });
    }

    return {
      ok: true,
      enforced: true,
      seat,
      nextTurn,
    };
  });
}
