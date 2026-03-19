import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";

import type { AuthService } from "../../../domain/auth/authService";
import type { PrismaClientLike } from "./types";
import { registerGameRoutes } from "./games";

test("GET /games/:roomCode returns persisted move history replay payload", async () => {
  const createdAt = new Date("2026-03-19T09:00:00.000Z");
  const updatedAt = new Date("2026-03-19T09:15:00.000Z");
  const moveCreatedAt = new Date("2026-03-19T09:05:00.000Z");

  const socialPrisma = {
    gameSession: {
      async findUnique() {
        return {
          roomCode: "room-abc",
          status: "active",
          turnColor: "black",
          moveCount: 1,
          winnerSeat: null,
          terminationReason: null,
          endedAt: null,
          createdAt,
          updatedAt,
          whitePlayer: { id: "u1", username: "Alpha" },
          blackPlayer: { id: "u2", username: "Beta" },
          moves: [
            {
              ply: 1,
              fromSquare: "e2",
              toSquare: "e4",
              promotion: null,
              seat: "white",
              playerUserId: "u1",
              createdAt: moveCreatedAt,
            },
          ],
        };
      },
    },
  } as unknown as PrismaClientLike;

  const authService = {
    async getMe() {
      return { id: "u1" };
    },
  } as unknown as AuthService;

  const app = Fastify();
  registerGameRoutes(app, socialPrisma, authService);
  await app.ready();

  const response = await app.inject({
    method: "GET",
    url: "/games/room-abc",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    game: {
      roomCode: "room-abc",
      status: "active",
      turnColor: "black",
      moveCount: 1,
      winnerSeat: null,
      terminationReason: null,
      endedAt: null,
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:15:00.000Z",
      whitePlayer: { id: "u1", username: "Alpha" },
      blackPlayer: { id: "u2", username: "Beta" },
      moves: [
        {
          ply: 1,
          from: "e2",
          to: "e4",
          promotion: null,
          seat: "white",
          playerUserId: "u1",
          createdAt: "2026-03-19T09:05:00.000Z",
        },
      ],
    },
  });

  await app.close();
});
