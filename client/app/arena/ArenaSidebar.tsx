import type { PlayerMode } from "../lib/usePlayerIdentity";

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
  onRoomChange: (value: string) => void;
  onModeChange: (value: PlayerMode) => void;
  onGuestNameChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onCopyInvite: () => void;
  onCreateSignedInvite: () => void;
  onAcceptInvite: () => void;
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
  onRoomChange,
  onModeChange,
  onGuestNameChange,
  onConnect,
  onDisconnect,
  onCopyInvite,
  onCreateSignedInvite,
  onAcceptInvite,
}: ArenaSidebarProps) {
  return (
    <aside className={`arena-sidebar shell-card ${isOpen ? "is-open" : ""}`}>
      <header className="arena-sidebar-head">
        <p className="eyebrow">Arena Control</p>
        <h1>Chess Championship</h1>
        <p>Connection, identity, and invites live here while the board stays center stage.</p>
      </header>

      <section className="panel arena-status">
        <div className="arena-status-row">
          <div className="arena-status-left">
            <div className={`pill ${connected ? "ok" : "warn"}`}>{connected ? "Live" : "Offline"}</div>
            <div className="arena-status-text">
              <div className="arena-status-title">Room: {room}</div>
              <div className="arena-status-sub">{status}</div>
            </div>
          </div>

          {!connected ? (
            <button onClick={onConnect} className="control-btn" type="button">
              Connect
            </button>
          ) : (
            <button onClick={onDisconnect} className="control-btn" type="button">
              Disconnect
            </button>
          )}
        </div>

        <details className="arena-details" open>
          <summary>Connection settings</summary>
          <div className="controls-row arena-controls">
            <input
              aria-label="Room"
              value={room}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="championship-1"
            />
            <select
              aria-label="Play mode"
              value={mode}
              onChange={(event) => onModeChange(event.target.value as PlayerMode)}
            >
              <option value="guest">Play as Guest</option>
              <option value="account">Play with Account (coming soon)</option>
            </select>
            {mode === "guest" ? (
              <input
                aria-label="Guest display name"
                value={guestProfile.displayName}
                onChange={(event) => onGuestNameChange(event.target.value)}
                placeholder="Guest display name"
              />
            ) : null}
            <div className="arena-autoconnect">
              Auto-connect: <strong>{autoConnectEnabled ? "On" : "Off"}</strong>
            </div>
            <div className="arena-meta-grid">
              <div>
                Peers in room: <strong>{peersInRoom}</strong>
              </div>
              <div>
                Mode: <strong>{mode === "guest" ? "Guest" : "Account"}</strong>
              </div>
              <div>
                Guest ID: <strong>{guestProfile.id}</strong>
              </div>
              <div>
                WS endpoint: <code>{wsUrl}</code>
              </div>
              <div>
                Last WS error: <strong>{lastWsError ?? "None"}</strong>
              </div>
              <div>
                Seat: <strong>{seat ?? "Unassigned"}</strong>
              </div>
            </div>

            <div className="invite-strip">
              <input readOnly value={inviteLink} aria-label="Invite link" />
              <button onClick={onCopyInvite} className="control-btn" type="button">
                Copy Invite Link
              </button>
              <button onClick={onCreateSignedInvite} className="control-btn" type="button" disabled={inviteBusy}>
                Create Signed Invite
              </button>
              {inviteCode ? (
                <button onClick={onAcceptInvite} className="control-btn" type="button" disabled={inviteBusy}>
                  Accept Invite
                </button>
              ) : null}
              <span className="invite-copy-state">
                {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : ""}
              </span>
            </div>
            {inviteInfo ? <div className="lobby-note">{inviteInfo}</div> : null}
          </div>
        </details>
      </section>
    </aside>
  );
}
