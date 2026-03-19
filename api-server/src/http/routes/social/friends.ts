import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import { registerFriendRequestRoutes } from "./friendRequests";
import { registerFriendshipRoutes } from "./friendships";
import type { PrismaClientLike } from "./types";

export function registerFriendRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  registerFriendshipRoutes(app, socialPrisma, authService);
  registerFriendRequestRoutes(app, socialPrisma, authService);
}
