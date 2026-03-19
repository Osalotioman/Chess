import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuthService } from "../../../domain/auth/authService";
import { getCurrentUserId, runWithTableGuard } from "./guards";
import type { PrismaClientLike } from "./types";

const roomCodeParamsSchema = z.object({
  roomCode: z.string().trim().min(1).max(64),
});

const gamesQuerySchema = z.object({
  status: z.enum(["waiting", "active", "finished", "cancelled"]).optional(),
  mine: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export function registerGameRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  app.get("/games", async (request, reply) => {
    const parsedQuery = gamesQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.status(400).send({ message: "Invalid query" });
    }

    let currentUserId: string | null = null;
    if (parsedQuery.data.mine) {
      try {
        currentUserId = await getCurrentUserId(request, authService);
      } catch {
        return reply.status(401).send({ message: "Unauthorized" });
      }
    }

    return runWithTableGuard(app, reply, async () => {
      const games = await socialPrisma.gameSession.findMany({
        where: {
          ...(parsedQuery.data.status ? { status: parsedQuery.data.status } : {}),
          ...(currentUserId
            ? {
                OR: [{ whitePlayerId: currentUserId }, { blackPlayerId: currentUserId }],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          roomCode: true,
          status: true,
          moveCount: true,
          turnColor: true,
          winnerSeat: true,
          terminationReason: true,
          endedAt: true,
          createdAt: true,
          updatedAt: true,
          whitePlayer: { select: { username: true } },
          blackPlayer: { select: { username: true } },
        },
      });

      return reply.send({
        games: games.map((game) => ({
          roomCode: game.roomCode,
          status: game.status,
          moveCount: game.moveCount,
          turnColor: game.turnColor,
          winnerSeat: game.winnerSeat,
          terminationReason: game.terminationReason,
          endedAt: game.endedAt?.toISOString() ?? null,
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          whiteUsername: game.whitePlayer?.username ?? null,
          blackUsername: game.blackPlayer?.username ?? null,
        })),
      });
    });
  });

  app.get("/games/:roomCode", async (request, reply) => {
    const parsedParams = roomCodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid room code" });
    }

    return runWithTableGuard(app, reply, async () => {
      const game = await socialPrisma.gameSession.findUnique({
        where: { roomCode: parsedParams.data.roomCode },
        include: {
          whitePlayer: { select: { id: true, username: true } },
          blackPlayer: { select: { id: true, username: true } },
          moves: {
            orderBy: { ply: "asc" },
            select: {
              ply: true,
              fromSquare: true,
              toSquare: true,
              promotion: true,
              seat: true,
              playerUserId: true,
              createdAt: true,
            },
          },
        },
      });

      if (!game) {
        return reply.status(404).send({ message: "Game not found" });
      }

      return reply.send({
        game: {
          roomCode: game.roomCode,
          status: game.status,
          turnColor: game.turnColor,
          moveCount: game.moveCount,
          winnerSeat: game.winnerSeat,
          terminationReason: game.terminationReason,
          endedAt: game.endedAt?.toISOString() ?? null,
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          whitePlayer: game.whitePlayer,
          blackPlayer: game.blackPlayer,
          moves: game.moves.map((move) => ({
            ply: move.ply,
            from: move.fromSquare,
            to: move.toSquare,
            promotion: move.promotion,
            seat: move.seat,
            playerUserId: move.playerUserId,
            createdAt: move.createdAt.toISOString(),
          })),
        },
      });
    });
  });

  app.post("/games/:roomCode/abort", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = roomCodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid room code" });
    }

    return runWithTableGuard(app, reply, async () => {
      const game = await socialPrisma.gameSession.findUnique({
        where: { roomCode: parsedParams.data.roomCode },
        select: {
          id: true,
          roomCode: true,
          status: true,
          whitePlayerId: true,
          blackPlayerId: true,
        },
      });

      if (!game) {
        return reply.status(404).send({ message: "Game not found" });
      }

      const abortedBySeat =
        game.whitePlayerId === currentUserId
          ? "white"
          : game.blackPlayerId === currentUserId
            ? "black"
            : null;

      if (!abortedBySeat) {
        return reply.status(403).send({ message: "Only seated players can abort this game" });
      }

      if (game.status === "finished" || game.status === "cancelled") {
        return reply.status(409).send({ message: "Game has already ended" });
      }

      const winnerSeat =
        abortedBySeat === "white"
          ? game.blackPlayerId
            ? "black"
            : null
          : game.whitePlayerId
            ? "white"
            : null;

      await socialPrisma.gameSession.update({
        where: { id: game.id },
        data: {
          status: "finished",
          winnerSeat,
          terminationReason: "abort",
          endedAt: new Date(),
        },
      });

      return reply.send({
        result: {
          roomCode: game.roomCode,
          status: "finished",
          abortedBySeat,
          winnerSeat,
        },
      });
    });
  });
}
