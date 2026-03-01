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

export interface RefreshTokenSession {
  tokenId: string;
  userId: string;
  expiresAt: Date;
}
