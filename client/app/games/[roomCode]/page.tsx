"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Square } from "chess.js";

import { ChessBoard } from "@components/ChessBoard";
import { ApiError, apiGet } from "@lib/api";

type GameMove = {
  ply: number;
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
  seat: "white" | "black";
  playerUserId: string | null;
  createdAt: string;
};

type PromotionPiece = "q" | "r" | "b" | "n";

type GameDetail = {
  roomCode: string;
  status: "waiting" | "active" | "finished" | "cancelled";
  turnColor: "white" | "black";
  moveCount: number;
  winnerSeat: "white" | "black" | null;
  terminationReason: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  whitePlayer: { id: string; username: string } | null;
  blackPlayer: { id: string; username: string } | null;
  moves: GameMove[];
};

export default function GameReplayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const [roomCode, setRoomCode] = useState<string>("");

  useEffect(() => {
    let active = true;

    params
      .then((resolved) => {
        if (!active) return;
        setRoomCode(resolved.roomCode);
      })
      .catch(() => {
        if (active) {
          setError("Invalid room code");
          setBusy(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!roomCode) return;
    let active = true;

    setBusy(true);
    setError(null);

    apiGet<{ game: GameDetail }>(`/games/${encodeURIComponent(roomCode)}`)
      .then((response) => {
        if (!active) return;
        setGame(response.game);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("Unable to load game replay");
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [roomCode]);

  const historySnapshot = useMemo(() => {
    if (!game) return null;
    return {
      moves: game.moves.map((move) => ({
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion as PromotionPiece | undefined,
      })),
      nonce: Date.now(),
    };
  }, [game]);

  return (
    <main className="grid min-h-[calc(100svh-52px)] gap-4 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Game Replay</h1>
        <p className="mt-1 text-sm text-slate-300">Read-only replay from persisted move history.</p>
      </header>

      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        {busy ? <p className="text-sm text-slate-300">Loading replay...</p> : null}
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}

        {game ? (
          <>
            <div className="mb-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <p>Room: <strong>{game.roomCode}</strong></p>
              <p>Status: <strong>{game.status}</strong></p>
              <p>Players: <strong>{game.whitePlayer?.username ?? "(open)"}</strong> vs <strong>{game.blackPlayer?.username ?? "(open)"}</strong></p>
              <p>Moves: <strong>{game.moveCount}</strong></p>
              <p>Termination: <strong>{game.terminationReason ?? "n/a"}</strong></p>
              <p>Winner: <strong>{game.winnerSeat ?? "n/a"}</strong></p>
            </div>

            <ChessBoard
              syncRoom={game.roomCode}
              historySnapshot={historySnapshot}
              readOnly
            />

            <div className="mt-3">
              <Link
                href="/games"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-slate-100"
              >
                Back to Games
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
