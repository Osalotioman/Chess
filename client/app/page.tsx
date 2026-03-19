"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-[calc(100svh-52px)] place-items-center p-4">
      <section className="w-full max-w-6xl rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-6 text-center shadow-2xl backdrop-blur md:p-10">
        <p className="mb-3 text-xs tracking-[0.18em] text-slate-400 uppercase">Chess Platform Alpha</p>
        <h1 className="mb-4 text-balance text-4xl leading-tight font-semibold text-transparent md:text-6xl bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text">
          Play Fast Games, Build Rivalries, Return for Rematches
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-slate-300">
          The arena is now moving toward identity-aware games, social invites, and a friend graph.
          Start with live head-to-head play and help shape the next release.
        </p>

        <div className="my-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 text-left transition hover:-translate-y-1 hover:border-emerald-300/70">
            <h3 className="mb-2 text-lg font-semibold text-slate-100">Live Matches</h3>
            <p className="text-sm text-slate-300">Low-latency multiplayer with reconnect support and room-based sessions.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 text-left transition hover:-translate-y-1 hover:border-emerald-300/70">
            <h3 className="mb-2 text-lg font-semibold text-slate-100">Identity Modes</h3>
            <p className="text-sm text-slate-300">Guest play is available now, with account-aware matchmaking in progress.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 text-left transition hover:-translate-y-1 hover:border-emerald-300/70">
            <h3 className="mb-2 text-lg font-semibold text-slate-100">Social Layer</h3>
            <p className="text-sm text-slate-300">Player discovery, friend requests, and direct game invites are now integrated.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/arena" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-300 to-teal-200 px-5 text-sm font-semibold text-slate-900 shadow-md shadow-emerald-900/30 transition hover:brightness-105">
            Enter Arena
          </Link>
          <Link href="/lobby" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-5 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/60 hover:bg-slate-700">
            Open Lobby
          </Link>
          <Link href="/settings" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-5 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/60 hover:bg-slate-700">
            Settings
          </Link>
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-2">
          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">Current mode: realtime arena</span>
          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">Live now: lobby friends and invite links</span>
        </div>
      </section>
    </main>
  );
}
