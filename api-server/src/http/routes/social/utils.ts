import { randomBytes } from "node:crypto";

import type { PrismaClientLike } from "./types";

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

export async function generateUniqueInviteCode(
  socialPrisma: PrismaClientLike,
  prefix = ""
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `${prefix}${randomBytes(4).toString("hex")}`;
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
  const nowHex = Date.now().toString(16).padStart(12, "0").slice(-12);
  const randomHex = randomBytes(10).toString("hex");
  return `${nowHex.slice(0, 8)}-${nowHex.slice(8, 12)}-7${randomHex.slice(0, 3)}-${randomHex.slice(3, 7)}-${randomHex.slice(7, 19)}`;
}
