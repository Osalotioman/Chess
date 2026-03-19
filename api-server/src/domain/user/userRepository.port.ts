import type { RefreshTokenSession, User, UserPublic } from "./user.types";

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  create(input: { username: string; email: string; passwordHash: string }): Promise<User>;
  createRefreshTokenSession(input: {
    userId: string;
    tokenId: string;
    expiresAt: Date;
  }): Promise<void>;
  findActiveRefreshTokenSession(input: {
    userId: string;
    tokenId: string;
  }): Promise<RefreshTokenSession | null>;
  revokeRefreshTokenSession(input: { userId: string; tokenId: string }): Promise<void>;
  revokeAllRefreshTokenSessions(userId: string): Promise<void>;
  toPublicUser(user: User): UserPublic;
}
