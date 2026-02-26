import type { FastifyRequest } from "fastify";
import { AuthError } from "../../domain/auth/authService.js";

export function getBearerToken(request: FastifyRequest): string {
  const authorization = request.headers.authorization;
  if (!authorization) {
    throw new AuthError("Missing authorization header", 401);
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AuthError("Invalid authorization header", 401);
  }

  return token;
}
