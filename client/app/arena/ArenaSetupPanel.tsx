import type { PlayerMode } from "@lib/usePlayerIdentity";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";

type ArenaSetupPanelProps = {
  room: string;
  mode: PlayerMode;
  guestProfile: { id: string; displayName: string };
  inviteCode: string | null;
  inviteKind: "player" | "spectator";
  inviteBusy: boolean;
  inviteInfo: string | null;
  inviteLink: string;
  copyStatus: "idle" | "copied" | "failed";
  hostSeat: "white" | "black";
  firstTurn: "white" | "black";
  onRoomChange: (value: string) => void;
  onModeChange: (value: PlayerMode) => void;
  onGuestNameChange: (value: string) => void;
  onHostSeatChange: (value: "white" | "black") => void;
  onFirstTurnChange: (value: "white" | "black") => void;
  onInviteKindChange: (value: "player" | "spectator") => void;
  onCreateRoom: () => void;
  onApplySetup: () => void;
  onCreateSignedInvite: () => void;
  onCopyInvite: () => void;
  onAcceptInvite: () => void;
};

export function ArenaSetupPanel({
  room,
  mode,
  guestProfile,
  inviteCode,
  inviteKind,
  inviteBusy,
  inviteInfo,
  inviteLink,
  copyStatus,
  hostSeat,
  firstTurn,
  onRoomChange,
  onModeChange,
  onGuestNameChange,
  onHostSeatChange,
  onFirstTurnChange,
  onInviteKindChange,
  onCreateRoom,
  onApplySetup,
  onCreateSignedInvite,
  onCopyInvite,
  onAcceptInvite,
}: ArenaSetupPanelProps) {
  const isInviteEntry = Boolean(inviteCode);
  const showJoinAction = isInviteEntry;
  const showHostSetup = !isInviteEntry;

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-4 py-2 sm:py-6">
      <header className="space-y-2 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-5 shadow-xl">
        <p className="text-xs tracking-[0.16em] text-slate-400 uppercase">Arena Setup</p>
        <h1 className="text-2xl font-semibold text-slate-100">Prepare the Match</h1>
        <p className="text-sm text-slate-300">
          Configure players and invite details first. Once ready, you move into a focused gameplay screen.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{isInviteEntry ? "Invite Join" : "Game Setup"}</CardTitle>
          <CardDescription>
            {isInviteEntry
              ? "This invite has match settings already. Confirm identity and join."
              : "Create room settings before entering gameplay."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              aria-label="Room"
              value={room}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="Room id"
              readOnly={isInviteEntry}
            />
            {showHostSetup ? (
              <Button onClick={onCreateRoom} variant="secondary" type="button">
                New Room
              </Button>
            ) : (
              <Button onClick={onCopyInvite} variant="secondary" type="button">
                Copy Invite
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-300">
              Play mode
              <Select
                aria-label="Play mode"
                value={mode}
                onChange={(event) => onModeChange(event.target.value as PlayerMode)}
              >
                <option value="guest">Play as Guest</option>
                <option value="account">Play with Account</option>
              </Select>
            </label>
            {mode === "guest" ? (
              <label className="grid gap-1 text-xs text-slate-300">
                Guest display name
                <Input
                  aria-label="Guest display name"
                  value={guestProfile.displayName}
                  onChange={(event) => onGuestNameChange(event.target.value)}
                  placeholder="Guest display name"
                />
              </label>
            ) : null}
            {showHostSetup ? (
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
            ) : null}
            {showHostSetup ? (
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
            ) : null}
          </div>

          {showHostSetup ? (
            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
              <Checkbox
                aria-label="Invite kind"
                checked={inviteKind === "spectator"}
                onChange={(event) => onInviteKindChange(event.target.checked ? "spectator" : "player")}
              />
              Create spectator invite instead of player invite
            </label>
          ) : (
            <p className="text-xs text-slate-300">
              Invite type: <strong>{inviteKind === "spectator" ? "Spectator" : "Player"}</strong>
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {showHostSetup ? (
              <Button onClick={onApplySetup} type="button">
                Enter Game
              </Button>
            ) : (
              <Button
                onClick={onAcceptInvite}
                variant="default"
                className="sm:col-span-2"
                type="button"
                disabled={inviteBusy}
              >
                {inviteBusy ? "Joining..." : "Join Match"}
              </Button>
            )}
            {showHostSetup ? (
              <Button onClick={onCreateSignedInvite} variant="secondary" type="button" disabled={inviteBusy}>
                Create Signed Invite
              </Button>
            ) : null}
            {showJoinAction ? (
              <p className="sm:col-span-2 text-xs text-slate-300">
                You will enter the game view immediately after join succeeds.
              </p>
            ) : null}
          </div>

          {showHostSetup ? (
            <div className="grid gap-2">
              <Input readOnly value={inviteLink} aria-label="Invite link" />
              <Button onClick={onCopyInvite} variant="secondary" type="button">
                Copy Invite Link
              </Button>
              <span className="text-xs text-slate-300">
                {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : ""}
              </span>
            </div>
          ) : null}

          {inviteInfo ? (
            <div className="rounded-md border border-slate-700/70 bg-slate-900 p-3 text-xs text-slate-300">
              {inviteInfo}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
