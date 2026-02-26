import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { type UserPublic, UserRepository } from "../user/userRepository.js";
import type { LoginInput, RefreshInput, SignupInput } from "./schemas.js";

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  type: z.enum(["access", "refresh"]),
});

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface AuthSession {
  user: UserPublic;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    const emailExists = this.userRepository.findByEmail(input.email);
    if (emailExists) {
      throw new AuthError("Email already in use", 409);
    }

    const usernameExists = this.userRepository.findByUsername(input.username);
    if (usernameExists) {
      throw new AuthError("Username already in use", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    return this.createSession(this.userRepository.toPublicUser(user));
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const normalized = input.emailOrUsername.trim();
    const user = normalized.includes("@")
      ? this.userRepository.findByEmail(normalized)
      : this.userRepository.findByUsername(normalized);

    if (!user) {
      throw new AuthError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthError("Invalid credentials", 401);
    }

    return this.createSession(this.userRepository.toPublicUser(user));
  }

  refresh(input: RefreshInput) {
    const payload = this.verifyToken(input.refreshToken, "refresh");
    const user = this.userRepository.findById(payload.sub);
    if (!user) {
      throw new AuthError("Invalid token", 401);
    }

    return this.issueTokens(user.id);
  }

  getMe(accessToken: string): UserPublic {
    const payload = this.verifyToken(accessToken, "access");
    const user = this.userRepository.findById(payload.sub);

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return this.userRepository.toPublicUser(user);
  }

  logout() {
    return { message: "Logged out" };
  }

  private createSession(user: UserPublic): AuthSession {
    const tokens = this.issueTokens(user.id);
    return {
      user,
      tokens,
    };
  }

  private issueTokens(userId: string) {
    const accessTokenTtl = env.ACCESS_TOKEN_TTL as unknown as SignOptions["expiresIn"];
    const refreshTokenTtl = env.REFRESH_TOKEN_TTL as unknown as SignOptions["expiresIn"];

    const accessToken = jwt.sign({ sub: userId, type: "access" }, env.JWT_ACCESS_SECRET, {
      expiresIn: accessTokenTtl,
    });

    const refreshToken = jwt.sign({ sub: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
      expiresIn: refreshTokenTtl,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  private verifyToken(token: string, expectedType: "access" | "refresh"): TokenPayload {
    try {
      const secret = expectedType === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
      const decoded = jwt.verify(token, secret);
      const payload = tokenPayloadSchema.parse(decoded);

      if (payload.type !== expectedType) {
        throw new AuthError("Invalid token", 401);
      }

      return payload;
    } catch {
      throw new AuthError("Invalid token", 401);
    }
  }
}
