import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuthService } from "../../../domain/auth/authService";
import { getCurrentUserId, runWithTableGuard } from "./guards";
import { abortGame, getGameDetail, listGames } from "./games.service";
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
      const payload = await listGames(socialPrisma, {
        status: parsedQuery.data.status,
        currentUserId,
      });

      return reply.send(payload);
    });
  });

  app.get("/games/:roomCode", async (request, reply) => {
    const parsedParams = roomCodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid room code" });
    }

    return runWithTableGuard(app, reply, async () => {
      const result = await getGameDetail(socialPrisma, parsedParams.data.roomCode);
      return reply.status(result.status).send(result.payload);
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
      const result = await abortGame(socialPrisma, parsedParams.data.roomCode, currentUserId);
      return reply.status(result.status).send(result.payload);
    });
  });
}
