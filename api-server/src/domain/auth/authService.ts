import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env.js";
import { type UserPublic, type UserRepositoryPort } from "../user/userRepository.js";
import type { LoginInput, RefreshInput, SignupInput } from "./schemas.js";

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  type: z.enum(["access", "refresh"]),
  jti: z.string().min(1).optional(),
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
  private readonly userRepository: UserRepositoryPort;

  constructor(userRepository: UserRepositoryPort) {
    this.userRepository = userRepository;
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    const emailExists = await this.userRepository.findByEmail(input.email);
    if (emailExists) {
      throw new AuthError("Email already in use", 409);
    }

    const usernameExists = await this.userRepository.findByUsername(input.username);
    if (usernameExists) {
      throw new AuthError("Username already in use", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    return this.createSession(this.userRepository.toPublicUser(user));
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const normalized = input.emailOrUsername.trim();
    const user = normalized.includes("@")
      ? await this.userRepository.findByEmail(normalized)
      : await this.userRepository.findByUsername(normalized);

    if (!user) {
      throw new AuthError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthError("Invalid credentials", 401);
    }

    return this.createSession(this.userRepository.toPublicUser(user));
  }

  async refresh(input: RefreshInput) {
    const payload = this.verifyToken(input.refreshToken, "refresh");
    const tokenId = payload.jti;
    if (!tokenId) {
      throw new AuthError("Invalid token", 401);
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new AuthError("Invalid token", 401);
    }

    const refreshSession = await this.userRepository.findActiveRefreshTokenSession({
      userId: user.id,
      tokenId,
    });

    if (!refreshSession) {
      throw new AuthError("Invalid token", 401);
    }

    if (refreshSession.expiresAt.getTime() <= Date.now()) {
      await this.userRepository.revokeRefreshTokenSession({ userId: user.id, tokenId });
      throw new AuthError("Token expired", 401);
    }

    await this.userRepository.revokeRefreshTokenSession({ userId: user.id, tokenId });

    return this.issueTokens(user.id);
  }

  async getMe(accessToken: string): Promise<UserPublic> {
    const payload = this.verifyToken(accessToken, "access");
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return this.userRepository.toPublicUser(user);
  }

  async logout(accessToken: string) {
    const payload = this.verifyToken(accessToken, "access");
    await this.userRepository.revokeAllRefreshTokenSessions(payload.sub);
    return { message: "Logged out" };
  }

  private async createSession(user: UserPublic): Promise<AuthSession> {
    const tokens = await this.issueTokens(user.id);
    return {
      user,
      tokens,
    };
  }

  private async issueTokens(userId: string) {
    const refreshTokenId = randomUUID();
    const accessTokenTtl = env.ACCESS_TOKEN_TTL as unknown as SignOptions["expiresIn"];
    const refreshTokenTtl = env.REFRESH_TOKEN_TTL as unknown as SignOptions["expiresIn"];

    const accessToken = jwt.sign({ sub: userId, type: "access" }, env.JWT_ACCESS_SECRET, {
      expiresIn: accessTokenTtl,
    });

    const refreshToken = jwt.sign({ sub: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
      jwtid: refreshTokenId,
      expiresIn: refreshTokenTtl,
    });

    const refreshDecoded = jwt.decode(refreshToken);
    const refreshPayload = tokenPayloadSchema
      .extend({ exp: z.number(), jti: z.string().min(1) })
      .safeParse(refreshDecoded);

    if (!refreshPayload.success) {
      throw new AuthError("Failed to issue token", 500);
    }

    await this.userRepository.createRefreshTokenSession({
      userId,
      tokenId: refreshPayload.data.jti,
      expiresAt: new Date(refreshPayload.data.exp * 1000),
    });

    const accessDecoded = jwt.decode(accessToken);
    const accessPayload = tokenPayloadSchema.extend({ exp: z.number(), iat: z.number() }).safeParse(accessDecoded);
    const expiresIn = accessPayload.success ? accessPayload.data.exp - accessPayload.data.iat : 15 * 60;

    return {
      accessToken,
      refreshToken,
      expiresIn,
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
