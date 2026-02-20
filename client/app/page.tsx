"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell landing">
      <section className="landing-hero">
        <h1>Chess Championship Arena1141</h1>
        <p>Compete in real-time chess tournaments with players worldwide</p>
        
        <div className="landing-features">
          <div className="feature-card">
            <h3>🎮 Live Multiplayer</h3>
            <p>Connect via WebSocket and play against opponents in real-time</p>
          </div>
          <div className="feature-card">
            <h3>🏆 Tournament Play</h3>
            <p>Join championship rooms and compete for rankings</p>
          </div>
          <div className="feature-card">
            <h3>⚙️ Customizable</h3>
            <p>Configure sound, orientation, and connection settings</p>
          </div>
        </div>

        <div className="landing-actions">
          <Link href="/arena" className="btn btn-primary">
            Enter Arena
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
