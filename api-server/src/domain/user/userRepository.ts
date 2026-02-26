import { randomUUID } from "node:crypto";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
}

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

export class UserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly userIdByUsername = new Map<string, string>();

  findByEmail(email: string): User | null {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalizedEmail);
    if (!userId) return null;
    return this.usersById.get(userId) ?? null;
  }

  findByUsername(username: string): User | null {
    const normalizedUsername = username.trim().toLowerCase();
    const userId = this.userIdByUsername.get(normalizedUsername);
    if (!userId) return null;
    return this.usersById.get(userId) ?? null;
  }

  findById(userId: string): User | null {
    return this.usersById.get(userId) ?? null;
  }

  create(input: { username: string; email: string; passwordHash: string }): User {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
      rating: 1200,
    };

    this.usersById.set(user.id, user);
    this.userIdByEmail.set(user.email, user.id);
    this.userIdByUsername.set(user.username.toLowerCase(), user.id);

    return user;
  }

  toPublicUser(user: User): UserPublic {
    return toPublicUser(user);
  }
}
