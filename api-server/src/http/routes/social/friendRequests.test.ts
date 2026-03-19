import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import type { PrismaClientLike } from "./types";
import { registerFriendRequestRoutes } from "./friendRequests";

test("POST /friends/requests rejects self-friend requests before DB access", async () => {
  let dbTouched = false;

  const socialPrisma = new Proxy(
    {},
    {
      get() {
        dbTouched = true;
        throw new Error("Unexpected database access");
      },
    }
  ) as PrismaClientLike;

  const authService = {
    async getMe() {
      return {
        id: "user-1",
      };
    },
  } as unknown as AuthService;

  const app = Fastify();
  registerFriendRequestRoutes(app, socialPrisma, authService);

  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/friends/requests",
    headers: {
      authorization: "Bearer test-token",
    },
    payload: {
      receiverUserId: "user-1",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { message: "You cannot friend yourself" });
  assert.equal(dbTouched, false);

  await app.close();
});
