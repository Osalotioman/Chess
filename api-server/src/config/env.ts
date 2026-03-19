import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  ALLOWED_ORIGINS: z.string().default("*"),
  CORS_ALLOW_CREDENTIALS: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  CORS_ALLOW_NO_ORIGIN: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  INTERNAL_WS_SHARED_SECRET: z
    .string()
    .min(16, "INTERNAL_WS_SHARED_SECRET must be at least 16 chars"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.ALLOWED_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return env.CORS_ALLOW_NO_ORIGIN;
  }

  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}
