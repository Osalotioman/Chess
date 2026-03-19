import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService.js";
import { registerFriendRequestRoutes } from "./friendRequests.js";
import { registerFriendshipRoutes } from "./friendships.js";
import type { PrismaClientLike } from "./types.js";

export function registerFriendRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  registerFriendshipRoutes(app, socialPrisma, authService);
  registerFriendRequestRoutes(app, socialPrisma, authService);
}
