import type { FastifyInstance } from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import { registerFriendRoutes } from "./friends";
import { registerGameRoutes } from "./games";
import { registerInviteRoutes } from "./invites";
import { registerPlayerRoutes } from "./players";
import type { PrismaClientLike } from "./types";

export function registerSocialRoutes(
  app: FastifyInstance,
  socialPrisma: PrismaClientLike,
  authService: AuthService
) {
  registerPlayerRoutes(app, socialPrisma);
  registerFriendRoutes(app, socialPrisma, authService);
  registerInviteRoutes(app, socialPrisma, authService);
  registerGameRoutes(app, socialPrisma, authService);
}
