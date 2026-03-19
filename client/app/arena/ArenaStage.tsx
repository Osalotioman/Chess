import { ChessBoard } from "@components/ChessBoard";
import { Button } from "@components/ui/button";
import type { Square } from "chess.js";

type PromotionPiece = "q" | "r" | "b" | "n";

type ArenaStageProps = {
  connected: boolean;
  seat: "white" | "black" | "spectator" | null;
  room: string;
  setupApplied: boolean;
  isSidebarOpen: boolean;
  orientation: "white" | "black";
  historySnapshot: {
    moves: { from: Square; to: Square; promotion?: PromotionPiece }[];
    nonce: number;
  } | null;
  remoteMove: { from: Square; to: Square; promotion?: PromotionPiece; nonce: number } | null;
  onToggleMenu: () => void;
  onOrientationChange: (value: "white" | "black") => void;
  onLocalMove: (move: { from: Square; to: Square; promotion?: PromotionPiece }) => void;
  showMenuButton?: boolean;
};

export function ArenaStage({
  connected,
  seat,
  room,
  setupApplied,
  isSidebarOpen,
  orientation,
  historySnapshot,
  remoteMove,
  onToggleMenu,
  onOrientationChange,
  onLocalMove,
  showMenuButton = true,
}: ArenaStageProps) {
  const canPlay = connected && setupApplied && (seat === "white" || seat === "black");

  return (
    <section
      className="grid min-h-[calc(100svh-6.5rem)] grid-rows-[auto_1fr] gap-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-3 shadow-2xl sm:min-h-[calc(100svh-6rem)]"
      aria-label="Arena board stage"
    >
      <div className="flex items-center justify-between gap-3">
        {showMenuButton ? (
          <Button
            variant="secondary"
            className="lg:hidden"
            type="button"
            aria-label="Open arena menu"
            aria-expanded={isSidebarOpen}
            onClick={onToggleMenu}
          >
            <span className="inline-grid gap-1" aria-hidden="true">
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
            </span>
            Menu
          </Button>
        ) : (
          <div />
        )}

        <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 sm:rounded-full">
          <span
            className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
              connected
                ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-100"
                : "border-rose-300/60 bg-rose-300/10 text-rose-100"
            }`}
          >
            {connected ? "Live" : "Offline"}
          </span>
          {seat ? <span className="rounded-full border border-slate-600 px-2 py-1">Seat: {seat}</span> : null}
          {setupApplied ? <span className="rounded-full border border-slate-600 px-2 py-1">Match active</span> : null}
          <span className="max-w-[180px] truncate sm:max-w-none">
            Room <strong>{room}</strong>
          </span>
        </div>
      </div>

      <section className="grid min-h-0 place-items-center" aria-label="Chess board">
        <ChessBoard
          orientation={orientation}
          onOrientationChange={onOrientationChange}
          syncRoom={room}
          historySnapshot={historySnapshot}
          remoteMove={remoteMove}
          readOnly={!canPlay}
          authoritativeMoves
          onLocalMove={onLocalMove}
        />
      </section>
    </section>
  );
}
