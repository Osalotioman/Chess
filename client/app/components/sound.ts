"use client";

export type SoundName =
  | "click"
  | "button"
  | "move"
  | "capture"
  | "castle"
  | "check"
  | "promote"
  | "win"
  | "lose";

const soundSrc: Record<SoundName, string> = {
  click: "/public/sounds/click.mp3",
  button: "/public/sounds/buttons.mp3",
  move: "/public/sounds/move.mp3",
  capture: "/public/sounds/capture.mp3",
  castle: "/public/sounds/castle.mp3",
  check: "/public/sounds/check.mp3",
  promote: "/public/sounds/promote.mp3",
  win: "/public/sounds/win.mp3",
  lose: "/public/sounds/lose.mp3",
};

export function playSound(name: SoundName, volume = 0.55) {
  if (typeof window === "undefined") return;

  try {
    const audio = new Audio(soundSrc[name]);
    audio.volume = Math.max(0, Math.min(1, volume));
    void audio.play();
  } catch {
    // ignore
  }
}
