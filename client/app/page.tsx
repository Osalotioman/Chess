"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell landing">
      <section className="landing-hero shell-card">
        <p className="eyebrow">Chess Platform Alpha</p>
        <h1>Play Fast Games, Build Rivalries, Return for Rematches</h1>
        <p>
          The arena is now moving toward identity-aware games, social invites, and a friend graph.
          Start with live head-to-head play and help shape the next release.
        </p>

        <div className="landing-features feature-grid">
          <div className="feature-card">
            <h3>Live Matches</h3>
            <p>Low-latency multiplayer with reconnect support and room-based sessions.</p>
          </div>
          <div className="feature-card">
            <h3>Identity Modes</h3>
            <p>Guest play is available now, with account-aware matchmaking in progress.</p>
          </div>
          <div className="feature-card">
            <h3>Social Layer</h3>
            <p>Player discovery, friend requests, and direct game invites are the next milestone.</p>
          </div>
        </div>

        <div className="landing-actions">
          <Link href="/arena" className="btn btn-primary">
            Enter Arena
          </Link>
          <Link href="/lobby" className="btn btn-secondary">
            Open Lobby
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            Settings
          </Link>
        </div>

        <div className="landing-meta">
          <span>Current mode: realtime arena</span>
          <span>Upcoming: friends and invite links</span>
        </div>
      </section>
    </main>
  );
}
