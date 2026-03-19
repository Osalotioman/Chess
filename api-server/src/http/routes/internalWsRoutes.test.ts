import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";

import { env } from "../../config/env";
import { registerInternalWsRoutes } from "./internalWsRoutes";
import type { PrismaClient } from "../../db/generated/prisma/client";

test("POST /internal/ws/rooms/:roomCode/presence marks game ended when no player sockets remain", async () => {
  const calls: Array<unknown> = [];

  const prismaClient = {
    gameSession: {
      async updateMany(args: unknown) {
        calls.push(args);
        return { count: 1 };
      },
    },
  } as unknown as PrismaClient;

  const app = Fastify();
  registerInternalWsRoutes(app, prismaClient);
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/internal/ws/rooms/room-42/presence",
    headers: {
      "x-internal-ws-secret": env.INTERNAL_WS_SHARED_SECRET,
    },
    payload: {
      playerSockets: 0,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true, ended: true });
  assert.equal(calls.length, 1);

  await app.close();
});

test("POST /internal/ws/rooms/:roomCode/presence keeps game active when player sockets remain", async () => {
  let updateCalled = false;

  const prismaClient = {
    gameSession: {
      async updateMany() {
        updateCalled = true;
        return { count: 1 };
      },
    },
  } as unknown as PrismaClient;

  const app = Fastify();
  registerInternalWsRoutes(app, prismaClient);
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/internal/ws/rooms/room-42/presence",
    headers: {
      "x-internal-ws-secret": env.INTERNAL_WS_SHARED_SECRET,
    },
    payload: {
      playerSockets: 2,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true, ended: false });
  assert.equal(updateCalled, false);

  await app.close();
});
