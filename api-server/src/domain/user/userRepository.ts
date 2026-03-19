import type { prisma } from "../../db/prisma";
import type { UserRepositoryPort } from "./userRepository.port";
import type { RefreshTokenSession, User, UserPublic } from "./user.types";

type PrismaClientLike = typeof prisma;
type DbUser = NonNullable<Awaited<ReturnType<PrismaClientLike["user"]["findUnique"]>>>;
type DbRefreshToken = NonNullable<Awaited<ReturnType<PrismaClientLike["refreshToken"]["findFirst"]>>>;

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    rating: user.rating,
  };
}

function mapPrismaUser(user: DbUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    rating: user.rating,
  };
}

function mapRefreshToken(session: DbRefreshToken): RefreshTokenSession {
  return {
    tokenId: session.tokenId,
    userId: session.userId,
    expiresAt: session.expiresAt,
  };
}

export class PrismaUserRepository implements UserRepositoryPort {
  private readonly prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) return null;
    return mapPrismaUser(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (!user) return null;
    return mapPrismaUser(user);
  }

  async findById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return mapPrismaUser(user);
  }

  async create(input: { username: string; email: string; passwordHash: string }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        username: input.username.trim().toLowerCase(),
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
      },
    });

    return mapPrismaUser(user);
  }

  async createRefreshTokenSession(input: {
    userId: string;
    tokenId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenId: input.tokenId,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findActiveRefreshTokenSession(input: {
    userId: string;
    tokenId: string;
  }): Promise<{ tokenId: string; userId: string; expiresAt: Date } | null> {
    const session = await this.prisma.refreshToken.findFirst({
      where: {
        userId: input.userId,
        tokenId: input.tokenId,
        revokedAt: null,
      },
    });

    if (!session) return null;
    return mapRefreshToken(session);
  }

  async revokeRefreshTokenSession(input: { userId: string; tokenId: string }): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: input.userId,
        tokenId: input.tokenId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokenSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  toPublicUser(user: User): UserPublic {
    return toPublicUser(user);
  }
}
