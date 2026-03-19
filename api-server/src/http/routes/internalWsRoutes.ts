import type { FastifyInstance } from "fastify";
import { z } from "zod";

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

      const nextTurn = seat === "white" ? "black" : "white";

      const updated = await tx.gameSession.updateMany({
        where: {
          id: game.id,
          turnColor: seat,
        },
        data: {
          status: "active",
          turnColor: nextTurn,
          moveCount: { increment: 1 },
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

      return {
        ok: true,
        enforced: true,
        seat,
        nextTurn,
      };
    });

    return reply.send(result);
  });
}
