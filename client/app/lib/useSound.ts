import { useCallback } from "react";
import { useSettings } from "./useSettings";

type SoundType = "move" | "capture" | "check" | "castling" | "promotion" | "win" | "lose";

const soundMap: Record<SoundType, string> = {
  move: "/sounds/click.mp3",
  capture: "/sounds/movesound.ogg",
  check: "/sounds/check.mp3",
  castling: "/sounds/castl.mp3",
  promotion: "/sounds/promote.mp3",
  win: "/sounds/winmaster.mp3",
  lose: "/sounds/lose.mp3",
};

export function useSound() {
  const { settings, mounted } = useSettings();

  const play = useCallback((soundType: SoundType) => {
    if (typeof window === "undefined") return;
    if (mounted && !settings.soundEnabled) return;
    
    try {
      const audio = new Audio(soundMap[soundType]);
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Silently handle blocked audio playback
      });
    } catch {
      // Silently handle any audio errors
    }
  }, [mounted, settings.soundEnabled]);

  return { play };
}
