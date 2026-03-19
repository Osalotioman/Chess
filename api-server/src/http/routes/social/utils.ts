import { randomBytes } from "node:crypto";

import type { PrismaClientLike } from "./types.js";

export async function createBidirectionalFriendship(
  socialPrisma: PrismaClientLike,
  userId: string,
  friendId: string
) {
  await socialPrisma.friendship.createMany({
    data: [
      { userId, friendId },
      { userId: friendId, friendId: userId },
    ],
    skipDuplicates: true,
  });
}

export async function generateUniqueInviteCode(socialPrisma: PrismaClientLike): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomBytes(4).toString("hex");
    const existing = await socialPrisma.invite.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate unique invite code");
}

export function generateFallbackRoomCode() {
  return `room-${randomBytes(3).toString("hex")}`;
}
