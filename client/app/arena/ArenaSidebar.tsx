import type { PlayerMode } from "@lib/usePlayerIdentity";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";

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
  onAbortGame: () => void;
};

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
  onAbortGame,
}: ArenaSidebarProps) {
  return (
    <aside
      className={`z-20 grid max-h-[100svh] content-start gap-4 overflow-y-auto border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-2xl lg:sticky lg:top-16 lg:max-h-[calc(100svh-5rem)] lg:rounded-2xl ${
        isOpen ? "translate-x-0" : "-translate-x-[104%] lg:translate-x-0"
      } fixed inset-y-0 left-0 w-[min(90vw,360px)] transition-transform duration-200 lg:relative lg:w-auto`}
    >
      <header>
        <p className="mb-2 text-xs tracking-[0.16em] text-slate-400 uppercase">Arena Control</p>
        <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">Chess Championship</h1>
        <p className="mt-1 text-sm text-slate-300">
          Connection, identity, and invites live here while the board stays center stage.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Session</CardTitle>
          <CardDescription>Realtime room controls and setup state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <Button onClick={onConnect} variant="secondary" type="button" disabled={!setupApplied}>
              Connect
            </Button>
          ) : (
            <Button onClick={onDisconnect} variant="secondary" type="button">
              Disconnect
            </Button>
          )}
        </div>

        <details className="overflow-hidden rounded-lg border border-slate-600/70 bg-slate-950/50">
          <summary className="cursor-pointer border-b border-slate-700/80 px-3 py-2 text-sm font-semibold text-slate-200">
            Connection settings
          </summary>

          <div className="grid gap-3 p-3">
            <Button onClick={onCreateRoom} variant="secondary" type="button" className="w-full">
              Create New Game Room
            </Button>
            <Input
              aria-label="Room"
              value={room}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="UUIDv7 room id"
            />
            <Select
              aria-label="Play mode"
              value={mode}
              onChange={(event) => onModeChange(event.target.value as PlayerMode)}
            >
              <option value="guest">Play as Guest</option>
              <option value="account">Play with Account</option>
            </Select>
            {mode === "guest" ? (
              <Input
                aria-label="Guest display name"
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
                <Select
                  aria-label="Host seat"
                  value={hostSeat}
                  onChange={(event) => onHostSeatChange(event.target.value as "white" | "black")}
                >
                  <option value="white">Host as White</option>
                  <option value="black">Host as Black</option>
                </Select>
              </label>
              <label className="grid gap-1 text-xs text-slate-300">
                First turn
                <Select
                  aria-label="First turn"
                  value={firstTurn}
                  onChange={(event) => onFirstTurnChange(event.target.value as "white" | "black")}
                >
                  <option value="white">White moves first</option>
                  <option value="black">Black moves first</option>
                </Select>
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <Checkbox
                  aria-label="Invite kind"
                  checked={inviteKind === "spectator"}
                  onChange={(event) => onInviteKindChange(event.target.checked ? "spectator" : "player")}
                />
                Create spectator invite instead of player invite
              </label>
              <p className="text-[11px] text-slate-400">
                Player invites are limited to two seats total. Use spectator invite once both player seats are occupied.
              </p>
              <Button onClick={onApplySetup} variant="secondary" type="button" className="w-full">
                {setupApplied ? "Setup Applied" : "Apply Setup"}
              </Button>
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
              <Input readOnly value={inviteLink} aria-label="Invite link" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={onCopyInvite} variant="secondary" type="button" className="w-full">
                  Copy Invite Link
                </Button>
                <Button
                  onClick={onCreateSignedInvite}
                  variant="secondary"
                  type="button"
                  className="w-full"
                  disabled={inviteBusy}
                >
                  Create Signed Invite
                </Button>
                {inviteCode ? (
                  <Button
                    onClick={onAcceptInvite}
                    variant="secondary"
                    className="w-full sm:col-span-2"
                    type="button"
                    disabled={inviteBusy}
                  >
                    Accept Invite
                  </Button>
                ) : null}
                <Button
                  onClick={onAbortGame}
                  variant="secondary"
                  className="w-full sm:col-span-2"
                  type="button"
                  disabled={inviteBusy || !seat || seat === "spectator"}
                >
                  Abort Current Game
                </Button>
              </div>
              <span className="text-xs text-slate-300">
                {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : ""}
              </span>
            </div>

            {inviteInfo ? <div className="border-t border-dashed border-slate-600 pt-2 text-xs text-slate-300">{inviteInfo}</div> : null}
          </div>
        </details>
        </CardContent>
      </Card>
    </aside>
  );
}
