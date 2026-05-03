"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiError, apiGet } from "@lib/api";
import { getAccessToken } from "@lib/session";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";

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
    return mineOnly ? "/games?mine=true" : "/games";
  }, [mineOnly]);

  const liveGames = useMemo(
    () => games.filter((game) => game.status === "waiting" || game.status === "active"),
    [games]
  );

  const pastGames = useMemo(
    () => games.filter((game) => game.status === "finished" || game.status === "cancelled"),
    [games]
  );

  useEffect(() => {
    let active = true;

    const token = mineOnly ? getAccessToken() : null;

    apiGet<{ games: GameListItem[] }>(queryPath, {
      ...(token ? { token } : {}),
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

  function onMineOnlyChange(next: boolean) {
    if (next && !getAccessToken()) {
      setError("Sign in to view only your matches.");
      return;
    }

    setBusy(true);
    setError(null);
    setMineOnly(next);
  }

  return (
    <main className="grid min-h-[calc(100svh-52px)] gap-3 p-3 sm:gap-4 sm:p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Games</h1>
        <p className="mt-1 text-sm text-slate-300">
          Browse live games and review past matches.
        </p>
      </header>

      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/70 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Live matches include waiting and active rooms. Past matches include finished and cancelled games.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="mb-4 inline-flex items-center gap-2 text-sm text-slate-200">
            <Checkbox checked={mineOnly} onChange={(event) => onMineOnlyChange(event.target.checked)} />
            Show only my games
          </label>

          {busy ? <p className="text-sm text-slate-300">Loading games...</p> : null}
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}

          {!busy && !error && games.length === 0 ? <p className="text-sm text-slate-300">No games found for this view.</p> : null}

          {!busy && !error ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-emerald-300/20 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">Live Matches</h3>
                  <span className="rounded-full border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100">
                    {liveGames.length}
                  </span>
                </div>
                {liveGames.length === 0 ? (
                  <p className="text-sm text-slate-300">No live matches right now.</p>
                ) : (
                  <ul className="grid gap-3">
                    {liveGames.map((game) => (
                      <li key={game.roomCode} className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-100">Room: {game.roomCode}</p>
                          <span className="rounded-full border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100">
                            {game.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {game.whiteUsername ?? "(open white)"} vs {game.blackUsername ?? "(open black)"}
                        </p>
                        <p className="text-xs text-slate-300">Moves: {game.moveCount} | Turn: {game.turnColor}</p>
                        <p className="text-xs text-slate-400">
                          {game.status === "waiting" ? "Waiting for players" : "In progress"}
                        </p>
                        <div className="mt-2">
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/games/${encodeURIComponent(game.roomCode)}`}>Open Replay</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">Past Matches</h3>
                  <span className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200">
                    {pastGames.length}
                  </span>
                </div>
                {pastGames.length === 0 ? (
                  <p className="text-sm text-slate-300">No past matches found.</p>
                ) : (
                  <ul className="grid gap-3">
                    {pastGames.map((game) => (
                      <li key={game.roomCode} className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
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
                            : "Finished"}
                        </p>
                        <div className="mt-2">
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/games/${encodeURIComponent(game.roomCode)}`}>Open Replay</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
