import type { PlayerMode } from "@lib/usePlayerIdentity";

type ArenaSidebarProps = {
  isOpen: boolean;
  connected: boolean;
  room: string;
  status: string;
  mode: PlayerMode;
  guestProfile: { id: string; displayName: string };
  autoConnectEnabled: boolean;
  peersInRoom: number;
  wsUrl: string;
  lastWsError: string | null;
  inviteLink: string;
  inviteCode: string | null;
  inviteBusy: boolean;
  copyStatus: "idle" | "copied" | "failed";
  inviteInfo: string | null;
  seat: "white" | "black" | "spectator" | null;
  hostSeat: "white" | "black";
  firstTurn: "white" | "black";
  inviteKind: "player" | "spectator";
  setupApplied: boolean;
  onRoomChange: (value: string) => void;
  onModeChange: (value: PlayerMode) => void;
  onGuestNameChange: (value: string) => void;
  onHostSeatChange: (value: "white" | "black") => void;
  onFirstTurnChange: (value: "white" | "black") => void;
  onInviteKindChange: (value: "player" | "spectator") => void;
  onApplySetup: () => void;
  onCreateRoom: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onCopyInvite: () => void;
  onCreateSignedInvite: () => void;
  onAcceptInvite: () => void;
};

const controlBtn =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm font-medium text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

const inputBase =
  "w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-300/70";

export function ArenaSidebar({
  isOpen,
  connected,
  room,
  status,
  mode,
  guestProfile,
  autoConnectEnabled,
  peersInRoom,
  wsUrl,
  lastWsError,
  inviteLink,
  inviteCode,
  inviteBusy,
  copyStatus,
  inviteInfo,
  seat,
  hostSeat,
  firstTurn,
  inviteKind,
  setupApplied,
  onRoomChange,
  onModeChange,
  onGuestNameChange,
  onHostSeatChange,
  onFirstTurnChange,
  onInviteKindChange,
  onApplySetup,
  onCreateRoom,
  onConnect,
  onDisconnect,
  onCopyInvite,
  onCreateSignedInvite,
  onAcceptInvite,
}: ArenaSidebarProps) {
  return (
    <aside
      className={`z-20 grid max-h-[calc(100svh-1rem)] content-start gap-4 overflow-y-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-2xl lg:sticky lg:top-16 ${
        isOpen ? "translate-x-0" : "-translate-x-[104%] lg:translate-x-0"
      } fixed inset-y-0 left-0 w-[min(86vw,360px)] transition-transform duration-200 lg:relative lg:w-auto`}
    >
      <header>
        <p className="mb-2 text-xs tracking-[0.16em] text-slate-400 uppercase">Arena Control</p>
        <h1 className="text-2xl font-semibold text-slate-100">Chess Championship</h1>
        <p className="mt-1 text-sm text-slate-300">
          Connection, identity, and invites live here while the board stays center stage.
        </p>
      </header>

      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                connected
                  ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-100"
                  : "border-rose-300/60 bg-rose-300/10 text-rose-100"
              }`}
            >
              {connected ? "Live" : "Offline"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-100">Room: {room}</div>
              <div className="truncate text-xs text-slate-300">{status}</div>
            </div>
          </div>

          {!connected ? (
            <button onClick={onConnect} className={controlBtn} type="button" disabled={!setupApplied}>
              Connect
            </button>
          ) : (
            <button onClick={onDisconnect} className={controlBtn} type="button">
              Disconnect
            </button>
          )}
        </div>

        <details className="overflow-hidden rounded-lg border border-slate-600/70 bg-slate-950/50">
          <summary className="cursor-pointer border-b border-slate-700/80 px-3 py-2 text-sm font-semibold text-slate-200">
            Connection settings
          </summary>

          <div className="grid gap-3 p-3">
            <button onClick={onCreateRoom} className={controlBtn} type="button">
              Create New Game Room
            </button>
            <input
              aria-label="Room"
              className={inputBase}
              value={room}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="UUIDv7 room id"
            />
            <select
              aria-label="Play mode"
              className={inputBase}
              value={mode}
              onChange={(event) => onModeChange(event.target.value as PlayerMode)}
            >
              <option value="guest">Play as Guest</option>
              <option value="account">Play with Account</option>
            </select>
            {mode === "guest" ? (
              <input
                aria-label="Guest display name"
                className={inputBase}
                value={guestProfile.displayName}
                onChange={(event) => onGuestNameChange(event.target.value)}
                placeholder="Guest display name"
              />
            ) : null}

            <div className="text-xs text-slate-300">
              Auto-connect: <strong>{autoConnectEnabled ? "On" : "Off"}</strong>
            </div>

            <div className="grid gap-2 rounded-md border border-slate-700/70 bg-slate-900 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Game Setup</div>
              <label className="grid gap-1 text-xs text-slate-300">
                Host seat
                <select
                  aria-label="Host seat"
                  className={inputBase}
                  value={hostSeat}
                  onChange={(event) => onHostSeatChange(event.target.value as "white" | "black")}
                >
                  <option value="white">Host as White</option>
                  <option value="black">Host as Black</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-slate-300">
                First turn
                <select
                  aria-label="First turn"
                  className={inputBase}
                  value={firstTurn}
                  onChange={(event) => onFirstTurnChange(event.target.value as "white" | "black")}
                >
                  <option value="white">White moves first</option>
                  <option value="black">Black moves first</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-slate-300">
                Invite kind
                <select
                  aria-label="Invite kind"
                  className={inputBase}
                  value={inviteKind}
                  onChange={(event) => onInviteKindChange(event.target.value as "player" | "spectator")}
                >
                  <option value="player">Player invite</option>
                  <option value="spectator">Spectator invite</option>
                </select>
              </label>
              <button onClick={onApplySetup} className={controlBtn} type="button">
                {setupApplied ? "Setup Applied" : "Apply Setup"}
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Peers in room: <strong>{peersInRoom}</strong>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Mode: <strong>{mode === "guest" ? "Guest" : "Account"}</strong>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Guest ID: <strong className="break-all">{guestProfile.id}</strong>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                WS endpoint: <code className="break-all">{wsUrl}</code>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Last WS error: <strong>{lastWsError ?? "None"}</strong>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Seat: <strong>{seat ?? "Unassigned"}</strong>
              </div>
              <div className="rounded-md border border-slate-700/70 bg-slate-900 p-2 text-xs text-slate-300">
                Setup: <strong>{setupApplied ? "Ready" : "Required"}</strong>
              </div>
            </div>

            <div className="grid gap-2">
              <input readOnly value={inviteLink} aria-label="Invite link" className={inputBase} />
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={onCopyInvite} className={controlBtn} type="button">
                  Copy Invite Link
                </button>
                <button onClick={onCreateSignedInvite} className={controlBtn} type="button" disabled={inviteBusy}>
                  Create Signed Invite
                </button>
                {inviteCode ? (
                  <button
                    onClick={onAcceptInvite}
                    className={`${controlBtn} sm:col-span-2`}
                    type="button"
                    disabled={inviteBusy}
                  >
                    Accept Invite
                  </button>
                ) : null}
              </div>
              <span className="text-xs text-slate-300">
                {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : ""}
              </span>
            </div>

            {inviteInfo ? <div className="border-t border-dashed border-slate-600 pt-2 text-xs text-slate-300">{inviteInfo}</div> : null}
          </div>
        </details>
      </section>
    </aside>
  );
}
