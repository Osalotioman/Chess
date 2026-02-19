"use client";

import Link from "next/link";
import { useSettings } from "../lib/useSettings";

export default function SettingsPage() {
  const { settings, patchSettings, mounted, defaultSettings, setSettings } = useSettings();

  if (!mounted) {
    return (
      <main className="page-shell">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <h1>Settings</h1>
        <p>Customize your chess experience</p>
      </header>

      <section className="panel settings-panel">
        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={settings.autoConnect}
              onChange={(e) => patchSettings({ autoConnect: e.target.checked })}
            />
            <span>Auto-connect to WebSocket</span>
          </label>
          <p className="settings-hint">
            Automatically connects and retries if the server is unavailable
          </p>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => patchSettings({ soundEnabled: e.target.checked })}
            />
            <span>Enable Sound Effects</span>
          </label>
          <p className="settings-hint">Play move, capture, and check sounds</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={settings.animationEnabled}
              onChange={(e) => patchSettings({ animationEnabled: e.target.checked })}
            />
            <span>Enable Animations</span>
          </label>
          <p className="settings-hint">Smooth transitions for piece movements</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={settings.notation}
              onChange={(e) => patchSettings({ notation: e.target.checked })}
            />
            <span>Show Algebraic Notation</span>
          </label>
          <p className="settings-hint">Display square labels (a1, b2, etc.)</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            Default Board Orientation
          </label>
          <select
            value={settings.boardOrientation}
            onChange={(e) =>
              patchSettings({
                boardOrientation: e.target.value as "white" | "black",
              })
            }
            className="settings-select"
          >
            <option value="white">White (Bottom)</option>
            <option value="black">Black (Bottom)</option>
          </select>
        </div>

        <button
          onClick={() => setSettings(defaultSettings)}
          className="btn btn-secondary"
        >
          Reset to Defaults
        </button>
      </section>

      <div className="settings-footer">
        <Link href="/" className="btn btn-secondary">
          Back to Home
        </Link>
        <Link href="/arena" className="btn btn-primary">
          Go to Arena
        </Link>
      </div>
    </main>
  );
}
