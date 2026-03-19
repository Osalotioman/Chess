"use client";

import Link from "next/link";
import { Button } from "@components/ui/button";
import { useSettings } from "../lib/useSettings";

export default function SettingsPage() {
  const { settings, patchSettings, mounted, defaultSettings, setSettings } = useSettings();

  if (!mounted) {
    return (
      <main className="grid min-h-[calc(100svh-52px)] place-items-center p-4 text-slate-300">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100svh-52px)] grid-rows-[auto_1fr_auto] gap-3 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-300">Customize your chess experience</p>
      </header>

      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <div className="mb-5 border-b border-slate-700 pb-5">
          <label className="mb-2 flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-100">
            <input
              type="checkbox"
              checked={settings.autoConnect}
              onChange={(e) => patchSettings({ autoConnect: e.target.checked })}
              className="h-4 w-4 accent-emerald-300"
            />
            <span>Auto-connect to WebSocket</span>
          </label>
          <p className="text-sm text-slate-300">
            Automatically connects and retries if the server is unavailable
          </p>
        </div>

        <div className="mb-5 border-b border-slate-700 pb-5">
          <label className="mb-2 flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-100">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => patchSettings({ soundEnabled: e.target.checked })}
              className="h-4 w-4 accent-emerald-300"
            />
            <span>Enable Sound Effects</span>
          </label>
          <p className="text-sm text-slate-300">Play move, capture, and check sounds</p>
        </div>

        <div className="mb-5 border-b border-slate-700 pb-5">
          <label className="mb-2 flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-100">
            <input
              type="checkbox"
              checked={settings.animationEnabled}
              onChange={(e) => patchSettings({ animationEnabled: e.target.checked })}
              className="h-4 w-4 accent-emerald-300"
            />
            <span>Enable Animations</span>
          </label>
          <p className="text-sm text-slate-300">Smooth transitions for piece movements</p>
        </div>

        <div className="mb-5 border-b border-slate-700 pb-5">
          <label className="mb-2 flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-100">
            <input
              type="checkbox"
              checked={settings.notation}
              onChange={(e) => patchSettings({ notation: e.target.checked })}
              className="h-4 w-4 accent-emerald-300"
            />
            <span>Show Algebraic Notation</span>
          </label>
          <p className="text-sm text-slate-300">Display square labels (a1, b2, etc.)</p>
        </div>

        <div className="mb-5 pb-1">
          <label className="mb-2 block text-sm font-medium text-slate-100">
            Default Board Orientation
          </label>
          <select
            value={settings.boardOrientation}
            onChange={(e) =>
              patchSettings({
                boardOrientation: e.target.value as "white" | "black",
              })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-300/70"
          >
            <option value="white">White (Bottom)</option>
            <option value="black">Black (Bottom)</option>
          </select>
        </div>

        <div className="mt-2">
          <Button
            onClick={() => setSettings(defaultSettings)}
            variant="secondary"
            type="button"
          >
            Reset to Defaults
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/arena">Go to Arena</Link>
        </Button>
      </div>
    </main>
  );
}
