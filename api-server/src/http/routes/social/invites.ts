import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService.js";
import { getCurrentUserId, runWithTableGuard } from "./guards.js";
import { createInviteSchema, inviteCodeParamsSchema } from "./schemas.js";
import type { PrismaClientLike } from "./types.js";
import { generateFallbackRoomCode, generateUniqueInviteCode } from "./utils.js";

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function registerInviteRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
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
      const roomCode = parsedBody.data.roomCode || generateFallbackRoomCode();

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
          fen: initialFen,
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
