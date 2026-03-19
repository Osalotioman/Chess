"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type PlayerMode = "guest" | "account";

export type GuestProfile = {
  id: string;
  displayName: string;
};

const MODE_KEY = "chess_player_mode";
const GUEST_KEY = "chess_guest_profile";
const IDENTITY_EVENT = "chess_identity_change";

function emitIdentityChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(IDENTITY_EVENT));
}

function fallbackGuestProfile(): GuestProfile {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `guest-${suffix}`,
    displayName: `Guest-${suffix}`,
  };
}

function generateGuestProfile(): GuestProfile {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    const id = crypto.randomUUID().slice(0, 8);
    return { id: `guest-${id}`, displayName: `Guest-${id}` };
  }
  return fallbackGuestProfile();
}

function getStoredMode(raw: string | null): PlayerMode {
  if (raw === "account") return "account";
  return "guest";
}

function getStoredGuest(raw: string | null): GuestProfile {
  if (!raw) return generateGuestProfile();

  try {
    const parsed = JSON.parse(raw) as Partial<GuestProfile>;
    if (typeof parsed.id !== "string" || parsed.id.trim().length === 0) {
      return generateGuestProfile();
    }
    if (typeof parsed.displayName !== "string" || parsed.displayName.trim().length < 2) {
      return { id: parsed.id, displayName: `Guest-${parsed.id.slice(-6)}` };
    }
    return { id: parsed.id, displayName: parsed.displayName.trim().slice(0, 24) };
  } catch {
    return generateGuestProfile();
  }
}

export function usePlayerIdentity() {
  const modeRaw = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const onChange = () => callback();
      window.addEventListener("storage", onChange);
      window.addEventListener(IDENTITY_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(IDENTITY_EVENT, onChange);
      };
    },
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(MODE_KEY);
    },
    () => "guest"
  );

  const guestRaw = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const onChange = () => callback();
      window.addEventListener("storage", onChange);
      window.addEventListener(IDENTITY_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(IDENTITY_EVENT, onChange);
      };
    },
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(GUEST_KEY);
    },
    () => JSON.stringify(fallbackGuestProfile())
  );

  const mode = useMemo(() => getStoredMode(modeRaw), [modeRaw]);
  const guestProfile = useMemo(() => getStoredGuest(guestRaw), [guestRaw]);

  const setMode = useCallback((nextMode: PlayerMode) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MODE_KEY, nextMode);

    if (!window.localStorage.getItem(GUEST_KEY)) {
      window.localStorage.setItem(GUEST_KEY, JSON.stringify(generateGuestProfile()));
    }

    emitIdentityChange();
  }, []);

  const setGuestDisplayName = useCallback((displayName: string) => {
    if (typeof window === "undefined") return;

    const current = getStoredGuest(window.localStorage.getItem(GUEST_KEY));
    const next = {
      ...current,
      displayName: displayName.trim().slice(0, 24) || current.displayName,
    };

    window.localStorage.setItem(GUEST_KEY, JSON.stringify(next));
    emitIdentityChange();
  }, []);

  const ensureGuestProfile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(GUEST_KEY)) {
      window.localStorage.setItem(GUEST_KEY, JSON.stringify(generateGuestProfile()));
      emitIdentityChange();
    }
  }, []);

  return {
    mode,
    setMode,
    guestProfile,
    setGuestDisplayName,
    ensureGuestProfile,
  };
}
