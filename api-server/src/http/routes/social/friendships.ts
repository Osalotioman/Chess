import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import { getCurrentUserId, runWithTableGuard } from "./guards";
import { friendIdParamsSchema } from "./schemas";
import type { PrismaClientLike } from "./types";

export function registerFriendshipRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  app.get("/friends", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return runWithTableGuard(app, reply, async () => {
      const friendships = await socialPrisma.friendship.findMany({
        where: { userId: currentUserId },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              rating: true,
            },
          },
        },
      });

      return reply.send({
        friends: friendships.map((item) => ({
          id: item.friend.id,
          username: item.friend.username,
          rating: item.friend.rating,
          online: false,
          since: item.createdAt.toISOString(),
        })),
      });
    });
  });

  app.delete("/friends/:friendId", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = friendIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid friend id" });
    }

    return runWithTableGuard(app, reply, async () => {
      const removed = await socialPrisma.friendship.deleteMany({
        where: {
          OR: [
            {
              userId: currentUserId,
              friendId: parsedParams.data.friendId,
            },
            {
              userId: parsedParams.data.friendId,
              friendId: currentUserId,
            },
          ],
        },
      });

      if (removed.count === 0) {
        return reply.status(404).send({ message: "Friendship not found" });
      }

      return reply.send({ ok: true, removed: removed.count });
    });
  });
}
