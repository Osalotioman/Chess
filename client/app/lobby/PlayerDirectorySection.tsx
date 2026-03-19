import { Button } from "@components/ui/button";

import type { Player } from "./types";

type PlayerDirectorySectionProps = {
  players: Player[];
  pendingRequests: string[];
  onRequestFriend: (playerId: string) => void;
};

export function PlayerDirectorySection({
  players,
  pendingRequests,
  onRequestFriend,
}: PlayerDirectorySectionProps) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
      <h2>Players on Platform</h2>
      <p className="mt-1 text-sm text-slate-300">Browse real player accounts and add friends directly.</p>
      <div className="mt-3 grid gap-2">
        {players.length === 0 ? (
          <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-slate-300">No players found.</div>
        ) : null}
        {players.map((player) => {
          const pending = pendingRequests.includes(player.id);
          return (
            <div
              className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]"
              key={player.id}
            >
              <div>
                <div className="font-semibold text-slate-100">{player.username}</div>
                <div className="text-xs text-slate-300">
                  Rating {player.rating} | {player.online ? "Online" : "Offline"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {player.isFriend ? (
                  <span className="rounded-full border border-emerald-300/70 bg-emerald-300/15 px-2 py-1 text-xs text-emerald-100">
                    Friend
                  </span>
                ) : null}
                {!player.isFriend ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onRequestFriend(player.id)}
                    disabled={pending}
                  >
                    {pending ? "Requested" : "Add Friend"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
