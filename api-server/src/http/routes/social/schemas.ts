import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  receiverUserId: z.string().min(1),
});

export const requestIdParamsSchema = z.object({
  requestId: z.string().min(1),
});

export const friendIdParamsSchema = z.object({
  friendId: z.string().min(1),
});

export const createInviteSchema = z.object({
  roomCode: z.string().trim().min(1).max(64).optional(),
  receiverUserId: z.string().trim().min(1).max(64).optional(),
  inviteKind: z.enum(["player", "spectator"]).default("player"),
  hostSeat: z.enum(["white", "black"]).default("white"),
  firstTurn: z.enum(["white", "black"]).default("white"),
  expiresInMinutes: z.coerce.number().int().min(5).max(60 * 24 * 7).default(120),
});

export const inviteCodeParamsSchema = z.object({
  code: z.string().trim().min(1),
});
