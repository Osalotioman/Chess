import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService.js";
import { registerFriendRoutes } from "./friends.js";
import { registerInviteRoutes } from "./invites.js";
import { registerPlayerRoutes } from "./players.js";
import type { PrismaClientLike } from "./types.js";

export function registerSocialRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  registerPlayerRoutes(app, socialPrisma);
  registerFriendRoutes(app, socialPrisma, authService);
  registerInviteRoutes(app, socialPrisma, authService);
}
