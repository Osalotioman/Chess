import type { PrismaClientLike } from "./types";
import { createBidirectionalFriendship } from "./utils";

type FriendRequestView = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
};

function toRequestView(request: {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
}): FriendRequestView {
  return {
    id: request.id,
    senderId: request.senderId,
    receiverId: request.receiverId,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
  };
}

export async function listFriendRequests(socialPrisma: PrismaClientLike, currentUserId: string) {
  const incoming = await socialPrisma.friendRequest.findMany({
    where: {
      receiverId: currentUserId,
      status: "pending",
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          rating: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const outgoing = await socialPrisma.friendRequest.findMany({
    where: {
      senderId: currentUserId,
      status: "pending",
    },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          rating: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    incoming: incoming.map((requestItem) => ({
      id: requestItem.id,
      senderId: requestItem.sender.id,
      senderUsername: requestItem.sender.username,
      senderRating: requestItem.sender.rating,
      createdAt: requestItem.createdAt.toISOString(),
    })),
    outgoing: outgoing.map((requestItem) => ({
      id: requestItem.id,
      receiverId: requestItem.receiver.id,
      receiverUsername: requestItem.receiver.username,
      receiverRating: requestItem.receiver.rating,
      createdAt: requestItem.createdAt.toISOString(),
    })),
  };
}

export async function sendFriendRequest(
  socialPrisma: PrismaClientLike,
  currentUserId: string,
  receiverUserId: string
) {
  const receiverUser = await socialPrisma.user.findUnique({
    where: { id: receiverUserId },
    select: { id: true },
  });

  if (!receiverUser) {
    return { status: 404 as const, payload: { message: "Player not found" } };
  }

  const existingFriendship = await socialPrisma.friendship.findFirst({
    where: {
      OR: [
        {
          userId: currentUserId,
          friendId: receiverUserId,
        },
        {
          userId: receiverUserId,
          friendId: currentUserId,
        },
      ],
    },
    select: { id: true },
  });

  if (existingFriendship) {
    return { status: 409 as const, payload: { message: "You are already friends" } };
  }

  const existingOutgoing = await socialPrisma.friendRequest.findFirst({
    where: {
      senderId: currentUserId,
      receiverId: receiverUserId,
      status: "pending",
    },
  });

  if (existingOutgoing) {
    return { status: 409 as const, payload: { message: "Friend request already pending" } };
  }

  const existingIncoming = await socialPrisma.friendRequest.findFirst({
    where: {
      senderId: receiverUserId,
      receiverId: currentUserId,
      status: "pending",
    },
  });

  if (existingIncoming) {
    const accepted = await socialPrisma.$transaction(async (tx) => {
      const updated = await tx.friendRequest.update({
        where: { id: existingIncoming.id },
        data: {
          status: "accepted",
          respondedAt: new Date(),
        },
      });

      await createBidirectionalFriendship(tx as PrismaClientLike, currentUserId, receiverUserId);

      return updated;
    });

    return {
      status: 201 as const,
      payload: {
        request: toRequestView(accepted),
        autoAccepted: true,
      },
    };
  }

  const created = await socialPrisma.friendRequest.create({
    data: {
      senderId: currentUserId,
      receiverId: receiverUserId,
      status: "pending",
    },
  });

  return {
    status: 201 as const,
    payload: {
      request: toRequestView(created),
      autoAccepted: false,
    },
  };
}

export async function acceptFriendRequest(
  socialPrisma: PrismaClientLike,
  currentUserId: string,
  requestId: string
) {
  const pending = await socialPrisma.friendRequest.findFirst({
    where: {
      id: requestId,
      receiverId: currentUserId,
      status: "pending",
    },
  });

  if (!pending) {
    return { status: 404 as const, payload: { message: "Pending request not found" } };
  }

  const accepted = await socialPrisma.$transaction(async (tx) => {
    const updated = await tx.friendRequest.update({
      where: { id: pending.id },
      data: {
        status: "accepted",
        respondedAt: new Date(),
      },
    });

    await createBidirectionalFriendship(tx as PrismaClientLike, pending.senderId, pending.receiverId);

    return updated;
  });

  return {
    status: 200 as const,
    payload: {
      request: toRequestView(accepted),
    },
  };
}

export async function rejectFriendRequest(
  socialPrisma: PrismaClientLike,
  currentUserId: string,
  requestId: string
) {
  const updated = await socialPrisma.friendRequest.updateMany({
    where: {
      id: requestId,
      receiverId: currentUserId,
      status: "pending",
    },
    data: {
      status: "rejected",
      respondedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { status: 404 as const, payload: { message: "Pending request not found" } };
  }

  return { status: 200 as const, payload: { ok: true } };
}

export async function cancelFriendRequest(
  socialPrisma: PrismaClientLike,
  currentUserId: string,
  requestId: string
) {
  const updated = await socialPrisma.friendRequest.updateMany({
    where: {
      id: requestId,
      senderId: currentUserId,
      status: "pending",
    },
    data: {
      status: "cancelled",
      respondedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { status: 404 as const, payload: { message: "Pending request not found" } };
  }

  return { status: 200 as const, payload: { ok: true } };
}
