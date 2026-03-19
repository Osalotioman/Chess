import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { AuthService } from "../../domain/auth/authService";
import { getBearerToken } from "../plugins/auth";
import type { prisma } from "../../db/prisma";

type PrismaClientLike = typeof prisma;

const sendFriendRequestSchema = z.object({
  receiverUserId: z.string().min(1),
});

const requestIdParamsSchema = z.object({
  requestId: z.string().min(1),
});

const friendIdParamsSchema = z.object({
  friendId: z.string().min(1),
});

const createInviteSchema = z.object({
  roomCode: z.string().trim().min(1).max(64).optional(),
  receiverUserId: z.string().trim().min(1).max(64).optional(),
  expiresInMinutes: z.coerce.number().int().min(5).max(60 * 24 * 7).default(120),
});

const inviteCodeParamsSchema = z.object({
  code: z.string().trim().min(1),
});

function isTableMissingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "P2021"
  );
}

function runWithTableGuard<T>(
  app: FastifyInstance,
  reply: FastifyReply,
  action: () => Promise<T>
) {
  return action().catch((error) => {
    if (isTableMissingError(error)) {
      return reply.status(503).send({
        message: "Database schema is not up to date. Run prisma migrations first.",
      });
    }

    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error" });
  });
}

async function getCurrentUserId(request: FastifyRequest, authService: AuthService) {
  const token = getBearerToken(request);
  const me = await authService.getMe(token);
  return me.id;
}

async function createBidirectionalFriendship(
  socialPrisma: PrismaClientLike,
  userId: string,
  friendId: string
) {
  await socialPrisma.friendship.createMany({
    data: [
      { userId, friendId },
      { userId: friendId, friendId: userId },
    ],
    skipDuplicates: true,
  });
}

async function generateUniqueInviteCode(socialPrisma: PrismaClientLike): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomBytes(4).toString("hex");
    const existing = await socialPrisma.invite.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }

  throw new Error("Unable to generate unique invite code");
}

export function registerSocialRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
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

  app.post("/invites", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedBody = createInviteSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({ message: "Invalid invite payload" });
    }

    return runWithTableGuard(app, reply, async () => {
      const roomCode = parsedBody.data.roomCode || `room-${randomBytes(3).toString("hex")}`;

      if (parsedBody.data.receiverUserId) {
        const isFriend = await socialPrisma.friendship.findFirst({
          where: {
            userId: currentUserId,
            friendId: parsedBody.data.receiverUserId,
          },
          select: { id: true },
        });

        if (!isFriend) {
          return reply.status(403).send({ message: "You can only send direct invites to friends" });
        }
      }

      const gameSession = await socialPrisma.gameSession.upsert({
        where: { roomCode },
        update: {},
        create: {
          roomCode,
          whitePlayerId: currentUserId,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        },
      });

      const code = await generateUniqueInviteCode(socialPrisma);
      const expiresAt = new Date(Date.now() + parsedBody.data.expiresInMinutes * 60_000);

      const invite = await socialPrisma.invite.create({
        data: {
          code,
          gameSessionId: gameSession.id,
          createdById: currentUserId,
          receiverId: parsedBody.data.receiverUserId,
          status: "waiting",
          expiresAt,
        },
      });

      return reply.status(201).send({
        invite: {
          id: invite.id,
          code: invite.code,
          roomCode,
          expiresAt: invite.expiresAt.toISOString(),
          receiverUserId: invite.receiverId,
          status: invite.status,
        },
      });
    });
  });

  app.get("/invites/:code", async (request, reply) => {
    const parsedParams = inviteCodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid invite code" });
    }

    return runWithTableGuard(app, reply, async () => {
      const invite = await socialPrisma.invite.findUnique({
        where: { code: parsedParams.data.code },
        include: {
          gameSession: {
            select: {
              roomCode: true,
              status: true,
              whitePlayerId: true,
              blackPlayerId: true,
            },
          },
        },
      });

      if (!invite) {
        return reply.status(404).send({ message: "Invite not found" });
      }

      const expired = invite.expiresAt.getTime() <= Date.now();
      const active = invite.status === "waiting" && !expired;

      return reply.send({
        invite: {
          code: invite.code,
          roomCode: invite.gameSession.roomCode,
          status: invite.status,
          active,
          expiresAt: invite.expiresAt.toISOString(),
          receiverUserId: invite.receiverId,
          seats: {
            whitePlayerId: invite.gameSession.whitePlayerId,
            blackPlayerId: invite.gameSession.blackPlayerId,
          },
        },
      });
    });
  });

  app.post("/invites/:code/accept", async (request, reply) => {
    let currentUserId: string;
    try {
      currentUserId = await getCurrentUserId(request, authService);
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsedParams = inviteCodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ message: "Invalid invite code" });
    }

    return runWithTableGuard(app, reply, async () => {
      const result = await socialPrisma.$transaction(async (tx) => {
        const invite = await tx.invite.findUnique({
          where: { code: parsedParams.data.code },
          include: {
            gameSession: true,
          },
        });

        if (!invite) {
          return { error: "Invite not found" as const };
        }

        if (invite.status !== "waiting") {
          return { error: "Invite is no longer available" as const };
        }

        if (invite.expiresAt.getTime() <= Date.now()) {
          await tx.invite.update({
            where: { id: invite.id },
            data: { status: "cancelled" },
          });
          return { error: "Invite has expired" as const };
        }

        if (invite.receiverId && invite.receiverId !== currentUserId) {
          return { error: "This invite is reserved for another player" as const };
        }

        let seat: "white" | "black" | "spectator" = "spectator";

        if (!invite.gameSession.whitePlayerId) {
          seat = "white";
        } else if (!invite.gameSession.blackPlayerId) {
          seat = "black";
        } else if (invite.gameSession.whitePlayerId === currentUserId) {
          seat = "white";
        } else if (invite.gameSession.blackPlayerId === currentUserId) {
          seat = "black";
        }

        const updatedGame = await tx.gameSession.update({
          where: { id: invite.gameSessionId },
          data:
            seat === "white"
              ? { whitePlayerId: currentUserId, status: "active" }
              : seat === "black"
                ? { blackPlayerId: currentUserId, status: "active" }
                : { status: "active" },
        });

        await tx.invite.update({
          where: { id: invite.id },
          data: {
            status: "active",
            receiverId: invite.receiverId ?? currentUserId,
          },
        });

        return {
          roomCode: updatedGame.roomCode,
          seat,
        };
      });

      if ("error" in result) {
        return reply.status(result.error === "Invite not found" ? 404 : 409).send({ message: result.error });
      }

      return reply.send({
        invite: {
          code: parsedParams.data.code,
          roomCode: result.roomCode,
          seat: result.seat,
        },
      });
    });
  });
}
