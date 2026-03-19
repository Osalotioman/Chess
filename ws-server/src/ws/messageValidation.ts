import type { Json, PlayerIdentity } from "../protocol.js";

export function safeJsonParse(raw: string): Json | undefined {
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return undefined;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidRoom(room: string): boolean {
  const trimmed = room.trim();
  if (trimmed.length < 3 || trimmed.length > 128) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export function normalizeMoveField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalizedValue = value.trim();
  if (normalizedValue.length < 1 || normalizedValue.length > 4) return null;
  return normalizedValue;
}

export function normalizePlayerIdentity(value: unknown): PlayerIdentity {
  if (!isRecord(value)) {
    return { mode: "guest" };
  }

  const mode = value.mode === "account" ? "account" : "guest";
  const guestId = typeof value.guestId === "string" ? value.guestId.trim().slice(0, 64) : undefined;
  const guestName =
    typeof value.guestName === "string" ? value.guestName.trim().slice(0, 32) : undefined;
  const userId = typeof value.userId === "string" ? value.userId.trim().slice(0, 64) : undefined;
  const username = typeof value.username === "string" ? value.username.trim().slice(0, 32) : undefined;
  const preferredSeat =
    value.preferredSeat === "white" || value.preferredSeat === "black"
      ? value.preferredSeat
      : value.preferredSeat === "spectator"
        ? "spectator"
        : undefined;

  const normalizedMode = mode === "account" && userId && userId.length > 0 ? "account" : "guest";

  return {
    mode: normalizedMode,
    guestId: guestId && guestId.length > 0 ? guestId : undefined,
    guestName: guestName && guestName.length > 0 ? guestName : undefined,
    userId: userId && userId.length > 0 ? userId : undefined,
    username: username && username.length > 0 ? username : undefined,
    preferredSeat,
  };
}
