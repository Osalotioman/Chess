import { apiDelete, apiGet, apiPost } from "./api";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthMessage {
  message: string;
}

export function signup(input: SignupInput) {
  return apiPost<AuthSession>("/auth/signup", input);
}

export function login(input: LoginInput) {
  return apiPost<AuthSession>("/auth/login", input);
}

export function refreshSession(input: RefreshTokenInput) {
  return apiPost<AuthTokens>("/auth/refresh", input);
}

export function getMe(accessToken: string) {
  return apiGet<UserProfile>("/auth/me", { token: accessToken });
}

export function logout(accessToken: string) {
  return apiDelete<AuthMessage>("/auth/logout", { token: accessToken });
}
