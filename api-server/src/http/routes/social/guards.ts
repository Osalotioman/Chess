import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import { getBearerToken } from "../../plugins/auth";

function isTableMissingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "P2021"
  );
}

export function runWithTableGuard<T>(
  app: FastifyInstance,
  reply: FastifyReply,
  action: () => Promise<T>
) {
  return action().catch((error) => {
    if (isTableMissingError(error)) {
      return reply.status(503).send({
        message: "Database schema is not up to date. Run prisma migrations first.",
      });
    }

    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error" });
  });
}

export async function getCurrentUserId(request: FastifyRequest, authService: AuthService) {
  const token = getBearerToken(request);
  const me = await authService.getMe(token);
  return me.id;
}
