import type { PrismaClientLike } from "./types";

type GameStatus = "waiting" | "active" | "finished" | "cancelled";

export async function listGames(
  socialPrisma: PrismaClientLike,
  filters: { status?: GameStatus; currentUserId?: string | null }
) {
  const games = await socialPrisma.gameSession.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.currentUserId
        ? {
            OR: [{ whitePlayerId: filters.currentUserId }, { blackPlayerId: filters.currentUserId }],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      roomCode: true,
      status: true,
      moveCount: true,
      turnColor: true,
      winnerSeat: true,
      terminationReason: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
      whitePlayer: { select: { username: true } },
      blackPlayer: { select: { username: true } },
    },
  });

  return {
    games: games.map((game) => ({
      roomCode: game.roomCode,
      status: game.status,
      moveCount: game.moveCount,
      turnColor: game.turnColor,
      winnerSeat: game.winnerSeat,
      terminationReason: game.terminationReason,
      endedAt: game.endedAt?.toISOString() ?? null,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      whiteUsername: game.whitePlayer?.username ?? null,
      blackUsername: game.blackPlayer?.username ?? null,
    })),
  };
}

export async function getGameDetail(socialPrisma: PrismaClientLike, roomCode: string) {
  const game = await socialPrisma.gameSession.findUnique({
    where: { roomCode },
    include: {
      whitePlayer: { select: { id: true, username: true } },
      blackPlayer: { select: { id: true, username: true } },
      moves: {
        orderBy: { ply: "asc" },
        select: {
          ply: true,
          fromSquare: true,
          toSquare: true,
          promotion: true,
          seat: true,
          playerUserId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!game) {
    return { status: 404 as const, payload: { message: "Game not found" } };
  }

  return {
    status: 200 as const,
    payload: {
      game: {
        roomCode: game.roomCode,
        status: game.status,
        turnColor: game.turnColor,
        moveCount: game.moveCount,
        winnerSeat: game.winnerSeat,
        terminationReason: game.terminationReason,
        endedAt: game.endedAt?.toISOString() ?? null,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
        moves: game.moves.map((move) => ({
          ply: move.ply,
          from: move.fromSquare,
          to: move.toSquare,
          promotion: move.promotion,
          seat: move.seat,
          playerUserId: move.playerUserId,
          createdAt: move.createdAt.toISOString(),
        })),
      },
    },
  };
}

export async function abortGame(
  socialPrisma: PrismaClientLike,
  roomCode: string,
  currentUserId: string
) {
  const game = await socialPrisma.gameSession.findUnique({
    where: { roomCode },
    select: {
      id: true,
      roomCode: true,
      status: true,
      whitePlayerId: true,
      blackPlayerId: true,
    },
  });

  if (!game) {
    return { status: 404 as const, payload: { message: "Game not found" } };
  }

  const abortedBySeat =
    game.whitePlayerId === currentUserId
      ? "white"
      : game.blackPlayerId === currentUserId
        ? "black"
        : null;

  if (!abortedBySeat) {
    return { status: 403 as const, payload: { message: "Only seated players can abort this game" } };
  }

  if (game.status === "finished" || game.status === "cancelled") {
    return { status: 409 as const, payload: { message: "Game has already ended" } };
  }

  const winnerSeat =
    abortedBySeat === "white" ? (game.blackPlayerId ? "black" : null) : game.whitePlayerId ? "white" : null;

  await socialPrisma.gameSession.update({
    where: { id: game.id },
    data: {
      status: "finished",
      winnerSeat,
      terminationReason: "abort",
      endedAt: new Date(),
    },
  });

  return {
    status: 200 as const,
    payload: {
      result: {
        roomCode: game.roomCode,
        status: "finished",
        abortedBySeat,
        winnerSeat,
      },
    },
  };
}
