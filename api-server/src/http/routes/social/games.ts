import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuthService } from "../../../domain/auth/authService";
import { getCurrentUserId, runWithTableGuard } from "./guards";
import type { PrismaClientLike } from "./types";

const roomCodeParamsSchema = z.object({
  roomCode: z.string().trim().min(1).max(64),
});

export function registerGameRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
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
          status: "cancelled",
        },
      });

      return reply.send({
        result: {
          roomCode: game.roomCode,
          status: "cancelled",
          abortedBySeat,
          winnerSeat,
        },
      });
    });
  });
}
