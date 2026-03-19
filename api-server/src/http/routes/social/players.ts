import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { runWithTableGuard } from "./guards.js";
import type { PrismaClientLike } from "./types.js";

export function registerPlayerRoutes(app: FastifyInstance, socialPrisma: PrismaClientLike) {
  app.get("/players", async (request, reply) => {
    const searchSchema = z.object({
      search: z.string().trim().optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    });

    const parsed = searchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid query params" });
    }

    const search = parsed.data.search?.toLowerCase();

    return runWithTableGuard(app, reply, async () => {
      const users = await socialPrisma.user.findMany({
        where: search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { rating: "desc" },
        take: parsed.data.limit,
        select: {
          id: true,
          username: true,
          rating: true,
          createdAt: true,
        },
      });

      return reply.send({
        players: users.map((user) => ({
          id: user.id,
          username: user.username,
          rating: user.rating,
          online: false,
          joinedAt: user.createdAt.toISOString(),
        })),
      });
    });
  });
}
