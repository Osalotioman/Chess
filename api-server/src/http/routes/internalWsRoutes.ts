import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Chess } from "chess.js";

import { env } from "../../config/env";
import type { PrismaClient } from "../../db/generated/prisma/client";

const paramsSchema = z.object({
  roomCode: z.string().min(1).max(64),
});

const bodySchema = z.object({
  player: z.object({
    mode: z.enum(["guest", "account"]).optional(),
    userId: z.string().trim().min(1).max(64).optional(),
  }),
  move: z
    .object({
      from: z.string().trim().min(2).max(4),
      to: z.string().trim().min(2).max(4),
      promotion: z.string().trim().min(1).max(2).optional(),
    })
    .optional(),
});

const presenceBodySchema = z.object({
  playerSockets: z.coerce.number().int().min(0),
});

export function registerInternalWsRoutes(app: FastifyInstance, prismaClient: PrismaClient) {
  app.post("/internal/ws/rooms/:roomCode/authorize-move", async (request, reply) => {
    const providedSecret = request.headers["x-internal-ws-secret"];
    if (providedSecret !== env.INTERNAL_WS_SHARED_SECRET) {
      return reply.status(401).send({ ok: false, reason: "Unauthorized internal request" });
    }

    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedBody = bodySchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      return reply.status(400).send({ ok: false, reason: "Invalid payload" });
    }

    const { roomCode } = parsedParams.data;
    const { userId } = parsedBody.data.player;

      const result = await prismaClient.$transaction(async (tx) => {
      const game = await tx.gameSession.findUnique({
        where: { roomCode },
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
        return { ok: true, enforced: false, seat: "spectator" as const, reason: "No game session for room" };
      }

      if (!userId) {
        return {
          ok: false,
          enforced: true,
          seat: "spectator" as const,
          reason: "Authenticated account required for this game room",
        };
      }

      const seat =
        game.whitePlayerId === userId ? "white" : game.blackPlayerId === userId ? "black" : "spectator";

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

      let nextTurn = game.turnColor;
      let nextFen = game.fen;
      const hasMove = Boolean(parsedBody.data.move);

      if (hasMove && parsedBody.data.move) {
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

        const promotion = parsedBody.data.move.promotion?.toLowerCase();
        const attempted = chess.move({
          from: parsedBody.data.move.from.toLowerCase(),
          to: parsedBody.data.move.to.toLowerCase(),
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

      if (hasMove && parsedBody.data.move) {
        await tx.gameMove.create({
          data: {
            gameSessionId: game.id,
            ply: game.moveCount + 1,
            fromSquare: parsedBody.data.move.from,
            toSquare: parsedBody.data.move.to,
            promotion: parsedBody.data.move.promotion,
            seat,
            playerUserId: userId,
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

    return reply.send(result);
  });

  app.post("/internal/ws/rooms/:roomCode/presence", async (request, reply) => {
    const providedSecret = request.headers["x-internal-ws-secret"];
    if (providedSecret !== env.INTERNAL_WS_SHARED_SECRET) {
      return reply.status(401).send({ ok: false, reason: "Unauthorized internal request" });
    }

    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedBody = presenceBodySchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      return reply.status(400).send({ ok: false, reason: "Invalid payload" });
    }

    const { roomCode } = parsedParams.data;
    const { playerSockets } = parsedBody.data;

    if (playerSockets > 0) {
      return reply.send({ ok: true, ended: false });
    }

    const updated = await prismaClient.gameSession.updateMany({
      where: {
        roomCode,
        status: { in: ["waiting", "active"] },
      },
      data: {
        status: "finished",
        terminationReason: "disconnect",
        endedAt: new Date(),
      },
    });

    return reply.send({ ok: true, ended: updated.count > 0 });
  });
}
