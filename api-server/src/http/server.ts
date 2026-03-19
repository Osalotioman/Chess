import Fastify from "fastify";
import cors from "@fastify/cors";
import { AuthService } from "../domain/auth/authService";
import { PrismaUserRepository } from "../domain/user/userRepository";
import { prisma } from "../db/prisma";
import { env, isOriginAllowed } from "../config/env";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerInternalWsRoutes } from "./routes/internalWsRoutes";
import { registerSocialRoutes } from "./routes/socialRoutes";

export function createServer() {
  const app = Fastify({ logger: true });

  const userRepository = new PrismaUserRepository(prisma);
  const authService = new AuthService(userRepository);

  app.register(cors, {
    credentials: env.CORS_ALLOW_CREDENTIALS,
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  app.get("/health", async () => {
    return {
      ok: true,
      uptimeSec: Math.round(process.uptime()),
      service: "api-server",
    };
  });

  app.get("/", async () => {
    return { ok: true, service: "api-server" };
  });

  registerAuthRoutes(app, authService);
  registerSocialRoutes(app, prisma, authService);
  registerInternalWsRoutes(app, prisma);

  return app;
}
