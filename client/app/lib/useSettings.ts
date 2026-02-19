import { useCallback, useMemo, useSyncExternalStore } from "react";

export interface Settings {
  soundEnabled: boolean;
  boardOrientation: "white" | "black";
  animationEnabled: boolean;
  notation: boolean;
  autoConnect: boolean;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  boardOrientation: "white",
  animationEnabled: true,
  notation: true,
  autoConnect: true,
};

const SETTINGS_KEY = "chess_settings";
const SETTINGS_EVENT = "chess_settings_change";

function emitSettingsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

function safeParseSettings(raw: string | null): Settings {
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

export function useSettings() {
  const raw = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const onChange = () => callback();
      window.addEventListener("storage", onChange);
      window.addEventListener(SETTINGS_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(SETTINGS_EVENT, onChange);
      };
    },
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(SETTINGS_KEY);
    },
    () => JSON.stringify(defaultSettings)
  );

  const hydrated = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const t = setTimeout(callback, 0);
      return () => clearTimeout(t);
    },
    () => true,
    () => false
  );

  const settings = useMemo(() => safeParseSettings(raw), [raw]);

  const setSettings = useCallback((next: Settings) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      emitSettingsChange();
    }
  }, []);

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    if (typeof window === "undefined") return;
    const current = safeParseSettings(window.localStorage.getItem(SETTINGS_KEY));
    const next = { ...current, ...patch };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    emitSettingsChange();
  }, []);

  return { settings, setSettings, patchSettings, mounted: hydrated, defaultSettings };
}
