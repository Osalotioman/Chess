import Fastify from "fastify";
import { AuthService } from "../domain/auth/authService.js";
import { PrismaUserRepository } from "../domain/user/userRepository.js";
import { prisma } from "../db/prisma.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";

export function createServer() {
  const app = Fastify({ logger: true });

  const userRepository = new PrismaUserRepository(prisma);
  const authService = new AuthService(userRepository);

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

  return app;
}
