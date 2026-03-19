import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AuthError, AuthService } from "../../domain/auth/authService.js";
import { loginSchema, refreshSchema, signupSchema } from "../../domain/auth/schemas.js";
import { getBearerToken } from "../plugins/auth.js";

function fromZodError(error: z.ZodError) {
  return {
    message: "Validation failed",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function registerAuthRoutes(app: FastifyInstance, authService: AuthService) {
  app.post("/auth/signup", async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(fromZodError(parsed.error));
    }

    const session = await authService.signup(parsed.data);
    return reply.status(201).send(session);
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(fromZodError(parsed.error));
    }

    const session = await authService.login(parsed.data);
    return reply.send(session);
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(fromZodError(parsed.error));
    }

    const tokens = await authService.refresh(parsed.data);
    return reply.send(tokens);
  });

  app.get("/auth/me", async (request, reply) => {
    const token = getBearerToken(request);
    const user = await authService.getMe(token);
    return reply.send(user);
  });

  app.delete("/auth/logout", async (request, reply) => {
    const token = getBearerToken(request);
    return reply.send(await authService.logout(token));
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error" });
  });
}
