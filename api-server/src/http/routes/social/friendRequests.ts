import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import { getCurrentUserId, runWithTableGuard } from "./guards";
import { requestIdParamsSchema, sendFriendRequestSchema } from "./schemas";
import type { PrismaClientLike } from "./types";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "./friendRequests.service";

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
      const payload = await listFriendRequests(socialPrisma, currentUserId);
      return reply.send(payload);
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
      const result = await sendFriendRequest(socialPrisma, currentUserId, parsed.data.receiverUserId);
      return reply.status(result.status).send(result.payload);
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
      const result = await acceptFriendRequest(socialPrisma, currentUserId, parsedParams.data.requestId);
      return reply.status(result.status).send(result.payload);
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
      const result = await rejectFriendRequest(socialPrisma, currentUserId, parsedParams.data.requestId);
      return reply.status(result.status).send(result.payload);
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
      const result = await cancelFriendRequest(socialPrisma, currentUserId, parsedParams.data.requestId);
      return reply.status(result.status).send(result.payload);
    });
  });
}
