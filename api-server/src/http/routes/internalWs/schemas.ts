import { z } from "zod";

export const internalWsRoomParamsSchema = z.object({
  roomCode: z.string().min(1).max(64),
});

export const internalWsAuthorizeBodySchema = z.object({
  player: z.object({
    mode: z.enum(["guest", "account"]).optional(),
    userId: z.string().trim().min(1).max(64).optional(),
  }),
  move: z
    .object({
      from: z.string().trim().min(2).max(4),
      to: z.string().trim().min(2).max(4),
      promotion: z.string().trim().min(1).max(2).optional(),
    })
    .optional(),
});

export const internalWsPresenceBodySchema = z.object({
  playerSockets: z.coerce.number().int().min(0),
});

export type InternalWsAuthorizeBody = z.infer<typeof internalWsAuthorizeBodySchema>;
