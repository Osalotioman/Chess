import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService.js";
import { getCurrentUserId, runWithTableGuard } from "./guards.js";
import { requestIdParamsSchema, sendFriendRequestSchema } from "./schemas.js";
import type { PrismaClientLike } from "./types.js";
import { createBidirectionalFriendship } from "./utils.js";

export function registerFriendRequestRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  app.get("/friends/requests", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return runWithTableGuard(app, reply, async () => {
      const incoming = await socialPrisma.friendRequest.findMany({
        where: {
          receiverId: currentUserId,
          status: "pending",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const outgoing = await socialPrisma.friendRequest.findMany({
        where: {
          senderId: currentUserId,
          status: "pending",
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        incoming: incoming.map((requestItem) => ({
          id: requestItem.id,
          senderId: requestItem.sender.id,
          senderUsername: requestItem.sender.username,
          senderRating: requestItem.sender.rating,
          createdAt: requestItem.createdAt.toISOString(),
        })),
        outgoing: outgoing.map((requestItem) => ({
          id: requestItem.id,
          receiverId: requestItem.receiver.id,
          receiverUsername: requestItem.receiver.username,
          receiverRating: requestItem.receiver.rating,
          createdAt: requestItem.createdAt.toISOString(),
        })),
      });
    });
  });

  app.post("/friends/requests", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = sendFriendRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid request body" });
    }

    if (parsed.data.receiverUserId === currentUserId) {
      return reply.status(400).send({ message: "You cannot friend yourself" });
    }

    return runWithTableGuard(app, reply, async () => {
      const receiverUser = await socialPrisma.user.findUnique({
        where: { id: parsed.data.receiverUserId },
        select: { id: true },
      });

      if (!receiverUser) {
        return reply.status(404).send({ message: "Player not found" });
      }

      const existingFriendship = await socialPrisma.friendship.findFirst({
        where: {
          OR: [
            {
              userId: currentUserId,
              friendId: parsed.data.receiverUserId,
            },
            {
              userId: parsed.data.receiverUserId,
              friendId: currentUserId,
            },
          ],
        },
        select: { id: true },
      });

      if (existingFriendship) {
        return reply.status(409).send({ message: "You are already friends" });
      }

      const existingOutgoing = await socialPrisma.friendRequest.findFirst({
        where: {
          senderId: currentUserId,
          receiverId: parsed.data.receiverUserId,
          status: "pending",
        },
      });

      if (existingOutgoing) {
        return reply.status(409).send({ message: "Friend request already pending" });
      }

      const existingIncoming = await socialPrisma.friendRequest.findFirst({
        where: {
          senderId: parsed.data.receiverUserId,
          receiverId: currentUserId,
          status: "pending",
        },
      });

      if (existingIncoming) {
        const accepted = await socialPrisma.$transaction(async (tx) => {
          const updated = await tx.friendRequest.update({
            where: { id: existingIncoming.id },
            data: {
              status: "accepted",
              respondedAt: new Date(),
            },
          });

          await createBidirectionalFriendship(tx as PrismaClientLike, currentUserId, parsed.data.receiverUserId);

          return updated;
        });

        return reply.status(201).send({
          request: {
            id: accepted.id,
            senderId: accepted.senderId,
            receiverId: accepted.receiverId,
            status: accepted.status,
            createdAt: accepted.createdAt.toISOString(),
            respondedAt: accepted.respondedAt?.toISOString() ?? null,
          },
          autoAccepted: true,
        });
      }

      const created = await socialPrisma.friendRequest.create({
        data: {
          senderId: currentUserId,
          receiverId: parsed.data.receiverUserId,
          status: "pending",
        },
      });

      return reply.status(201).send({
        request: {
          id: created.id,
          senderId: created.senderId,
          receiverId: created.receiverId,
          status: created.status,
          createdAt: created.createdAt.toISOString(),
          respondedAt: created.respondedAt?.toISOString() ?? null,
        },
        autoAccepted: false,
      });
    });
  });

  app.post("/friends/requests/:requestId/accept", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid request id" });
    }

    return runWithTableGuard(app, reply, async () => {
      const pending = await socialPrisma.friendRequest.findFirst({
        where: {
          id: parsedParams.data.requestId,
          receiverId: currentUserId,
          status: "pending",
        },
      });

      if (!pending) {
        return reply.status(404).send({ message: "Pending request not found" });
      }

      const accepted = await socialPrisma.$transaction(async (tx) => {
        const updated = await tx.friendRequest.update({
          where: { id: pending.id },
          data: {
            status: "accepted",
            respondedAt: new Date(),
          },
        });

        await createBidirectionalFriendship(tx as PrismaClientLike, pending.senderId, pending.receiverId);

        return updated;
      });

      return reply.send({
        request: {
          id: accepted.id,
          senderId: accepted.senderId,
          receiverId: accepted.receiverId,
          status: accepted.status,
          createdAt: accepted.createdAt.toISOString(),
          respondedAt: accepted.respondedAt?.toISOString() ?? null,
        },
      });
    });
  });

  app.post("/friends/requests/:requestId/reject", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid request id" });
    }

    return runWithTableGuard(app, reply, async () => {
      const updated = await socialPrisma.friendRequest.updateMany({
        where: {
          id: parsedParams.data.requestId,
          receiverId: currentUserId,
          status: "pending",
        },
        data: {
          status: "rejected",
          respondedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return reply.status(404).send({ message: "Pending request not found" });
      }

      return reply.send({ ok: true });
    });
  });

  app.post("/friends/requests/:requestId/cancel", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid request id" });
    }

    return runWithTableGuard(app, reply, async () => {
      const updated = await socialPrisma.friendRequest.updateMany({
        where: {
          id: parsedParams.data.requestId,
          senderId: currentUserId,
          status: "pending",
        },
        data: {
          status: "cancelled",
          respondedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return reply.status(404).send({ message: "Pending request not found" });
      }

      return reply.send({ ok: true });
    });
  });
}
