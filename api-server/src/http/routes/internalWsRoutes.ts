import type { FastifyInstance } from "fastify";

import { env } from "../../config/env";
import type { PrismaClient } from "../../db/generated/prisma/client";
import { authorizeAndPersistMove } from "./internalWs/authorizeMove";
import {
  internalWsAuthorizeBodySchema,
  internalWsPresenceBodySchema,
  internalWsRoomParamsSchema,
} from "./internalWs/schemas";

export function registerInternalWsRoutes(app: FastifyInstance, prismaClient: PrismaClient) {
  app.post("/internal/ws/rooms/:roomCode/authorize-move", async (request, reply) => {
    const providedSecret = request.headers["x-internal-ws-secret"];
    if (providedSecret !== env.INTERNAL_WS_SHARED_SECRET) {
      return reply.status(401).send({ ok: false, reason: "Unauthorized internal request" });
    }

    const parsedParams = internalWsRoomParamsSchema.safeParse(request.params);
    const parsedBody = internalWsAuthorizeBodySchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      return reply.status(400).send({ ok: false, reason: "Invalid payload" });
    }

    const result = await authorizeAndPersistMove(prismaClient, {
      roomCode: parsedParams.data.roomCode,
      userId: parsedBody.data.player.userId,
      move: parsedBody.data.move,
    });

    return reply.send(result);
  });

  app.post("/internal/ws/rooms/:roomCode/presence", async (request, reply) => {
    const providedSecret = request.headers["x-internal-ws-secret"];
    if (providedSecret !== env.INTERNAL_WS_SHARED_SECRET) {
      return reply.status(401).send({ ok: false, reason: "Unauthorized internal request" });
    }

    const parsedParams = internalWsRoomParamsSchema.safeParse(request.params);
    const parsedBody = internalWsPresenceBodySchema.safeParse(request.body);

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
