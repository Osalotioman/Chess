import Fastify from "fastify";
import { AuthService } from "../domain/auth/authService.js";
import { UserRepository } from "../domain/user/userRepository.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";

export function createServer() {
  const app = Fastify({ logger: true });

  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository);

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
