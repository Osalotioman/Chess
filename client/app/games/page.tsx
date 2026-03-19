"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiError, apiGet } from "@lib/api";
import { getAccessToken } from "@lib/session";

type GameListItem = {
  roomCode: string;
  status: "waiting" | "active" | "finished" | "cancelled";
  moveCount: number;
  turnColor: "white" | "black";
  winnerSeat: "white" | "black" | null;
  terminationReason: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  whiteUsername: string | null;
  blackUsername: string | null;
};

export default function GamesPage() {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const queryPath = useMemo(() => {
    if (!mineOnly) {
      return "/games?status=active";
    }
    return "/games?mine=true";
  }, [mineOnly]);

  useEffect(() => {
    let active = true;

    setBusy(true);
    setError(null);

    apiGet<{ games: GameListItem[] }>(queryPath, {
      ...(mineOnly && getAccessToken() ? { token: getAccessToken() ?? undefined } : {}),
    })
      .then((response) => {
        if (!active) return;
        setGames(response.games);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("Unable to load games");
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [mineOnly, queryPath]);

  return (
    <main className="grid min-h-[calc(100svh-52px)] gap-4 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Games</h1>
        <p className="mt-1 text-sm text-slate-300">
          Browse active games or your account-linked game history.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
              !mineOnly
                ? "border-emerald-300 bg-emerald-300 text-slate-900"
                : "border-slate-600 bg-slate-800 text-slate-100"
            }`}
          >
            Active Public Games
          </button>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
              mineOnly
                ? "border-emerald-300 bg-emerald-300 text-slate-900"
                : "border-slate-600 bg-slate-800 text-slate-100"
            }`}
          >
            My Games
          </button>
        </div>

        {busy ? <p className="text-sm text-slate-300">Loading games...</p> : null}
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}

        {!busy && !error && games.length === 0 ? (
          <p className="text-sm text-slate-300">No games found for this view.</p>
        ) : null}

        <ul className="grid gap-3">
          {games.map((game) => (
            <li
              key={game.roomCode}
              className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">Room: {game.roomCode}</p>
                <span className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200">
                  {game.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {game.whiteUsername ?? "(open white)"} vs {game.blackUsername ?? "(open black)"}
              </p>
              <p className="text-xs text-slate-300">Moves: {game.moveCount} | Turn: {game.turnColor}</p>
              <p className="text-xs text-slate-400">
                {game.terminationReason
                  ? `Ended: ${game.terminationReason}${game.winnerSeat ? ` (winner: ${game.winnerSeat})` : ""}`
                  : "In progress"}
              </p>
              <div className="mt-2">
                <Link
                  href={`/games/${encodeURIComponent(game.roomCode)}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-slate-100"
                >
                  Open Replay (Read-Only)
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
