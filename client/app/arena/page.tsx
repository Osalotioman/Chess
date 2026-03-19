"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChessBoard } from "../components/ChessBoard";
import { apiGet, apiPost } from "../lib/api";
import { getAccessToken } from "../lib/session";
import { useSettings } from "../lib/useSettings";
import { usePlayerIdentity } from "../lib/usePlayerIdentity";
import type { Square } from "chess.js";

type InviteLookupResponse = {
  invite: {
    code: string;
    roomCode: string;
    status: string;
    active: boolean;
    expiresAt: string;
  };
};

type InviteCreateResponse = {
  invite: {
    code: string;
    roomCode: string;
    expiresAt: string;
  };
};

type InviteAcceptResponse = {
  invite: {
    code: string;
    roomCode: string;
    seat: "white" | "black" | "spectator";
  };
};

export default function ArenaPage() {
  const { settings, mounted } = useSettings();
  const { mode, setMode, guestProfile, setGuestDisplayName, ensureGuestProfile } = usePlayerIdentity();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [room, setRoom] = useState("championship-1");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [lastWsError, setLastWsError] = useState<string | null>(null);
  const [peersInRoom, setPeersInRoom] = useState(0);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const [remoteMove, setRemoteMove] = useState<{
    from: Square;
    to: Square;
    promotion?: "q" | "r" | "b" | "n";
    nonce: number;
  } | null>(null);
  const [remotePendingFrom, setRemotePendingFrom] = useState<Square | null>(null);
  const remoteNonceRef = useRef(0);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

  const autoConnectEnabled = mounted ? settings.autoConnect : false;
  const canAttemptConnect = useMemo(() => {
    if (!autoConnectEnabled) return false;
    if (!room.trim()) return false;
    return true;
  }, [autoConnectEnabled, room]);

  function connect() {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    setStatus("Connecting...");
    setLastWsError(null);

    socket.onopen = () => {
      setConnected(true);
      setStatus("Connected");
      retryAttemptRef.current = 0;
      socket.send(
        JSON.stringify({
          type: "join",
          room,
          player: {
            mode,
            guestId: guestProfile.id,
            guestName: guestProfile.displayName,
          },
        })
      );
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
      setPeersInRoom(0);
      socketRef.current = null;

      if (canAttemptConnect) {
        scheduleRetry();
      }
    };

    socket.onerror = () => {
      setStatus("Connection error");
      setLastWsError("WebSocket transport error");
    };

    socket.onmessage = (event) => {
      const raw = String(event.data);

      try {
        const message = JSON.parse(raw) as {
          type?: string;
          room?: string;
          peers?: number;
          message?: string;
          from?: Square;
          to?: Square;
          promotion?: "q" | "r" | "b" | "n";
        };

        if (message.type === "joined" && message.room) {
          setPeersInRoom(typeof message.peers === "number" ? message.peers : 0);
          setStatus(`Connected (${mode} mode, room: ${message.room})`);
          return;
        }

        if (message.type === "peer_joined" || message.type === "peer_left") {
          if (typeof message.peers === "number") {
            setPeersInRoom(message.peers);
          }
          return;
        }

        if (message.type === "error" && message.message) {
          setLastWsError(message.message);
          setStatus(message.message);
          return;
        }

        if (message.type === "move" && message.from && message.to) {
          remoteNonceRef.current += 1;
          setRemoteMove({
            from: message.from,
            to: message.to,
            promotion: message.promotion,
            nonce: remoteNonceRef.current,
          });
          return;
        }
      } catch {
        // Ignore parse errors
      }

      // Legacy relay protocol: raw "11" style coordinates sent twice (from then to).
      if (/^[1-8][1-8]$/.test(raw)) {
        const file = Number(raw[0]);
        const rank = Number(raw[1]);
        const sq = `${String.fromCharCode("a".charCodeAt(0) + (file - 1))}${rank}` as Square;

        if (!remotePendingFrom) {
          setRemotePendingFrom(sq);
          return;
        }

        remoteNonceRef.current += 1;
        setRemoteMove({ from: remotePendingFrom, to: sq, nonce: remoteNonceRef.current });
        setRemotePendingFrom(null);
      }
    };
  }

  function scheduleRetry() {
    if (!canAttemptConnect) return;
    if (retryTimerRef.current) return;

    const attempt = retryAttemptRef.current;
    const delayMs = Math.min(10_000, 750 * Math.pow(1.6, attempt));
    retryAttemptRef.current = attempt + 1;

    setStatus(`Reconnecting in ${Math.ceil(delayMs / 1000)}s...`);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      connect();
    }, delayMs);
  }

  function disconnect() {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryAttemptRef.current = 0;
    socketRef.current?.close();
  }

  useEffect(() => {
    ensureGuestProfile();
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const inviteFromQuery = params.get("invite");
    const roomFromQuery = params.get("room");

    if (inviteFromQuery && inviteFromQuery.trim()) {
      setInviteCode(inviteFromQuery.trim());
    }

    if (roomFromQuery && roomFromQuery.trim()) {
      setRoom(roomFromQuery.trim());
    }
  }, [ensureGuestProfile]);

  useEffect(() => {
    if (!inviteCode) return;

    let active = true;
    setInviteBusy(true);
    setInviteInfo("Resolving invite...");

    apiGet<InviteLookupResponse>(`/invites/${encodeURIComponent(inviteCode)}`)
      .then((response) => {
        if (!active) return;
        setRoom(response.invite.roomCode);
        setInviteInfo(response.invite.active ? "Invite ready to join" : "Invite is no longer active");
      })
      .catch(() => {
        if (!active) return;
        setInviteInfo("Unable to resolve invite link");
      })
      .finally(() => {
        if (active) setInviteBusy(false);
      });

    return () => {
      active = false;
    };
  }, [inviteCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const link = inviteCode
      ? `${origin}/arena?invite=${encodeURIComponent(inviteCode)}`
      : `${origin}/arena?room=${encodeURIComponent(room.trim() || "championship-1")}`;
    setInviteLink(link);
    setCopyStatus("idle");
  }, [room, inviteCode]);

  async function createSignedInvite() {
    const token = getAccessToken();
    if (!token) {
      setInviteInfo("Log in to create signed invites. Using room link mode.");
      return;
    }

    setInviteBusy(true);
    try {
      const response = await apiPost<InviteCreateResponse>(
        "/invites",
        {
          roomCode: room.trim() || "championship-1",
        },
        { token }
      );
      setInviteCode(response.invite.code);
      setRoom(response.invite.roomCode);
      setInviteInfo("Signed invite created");
    } catch {
      setInviteInfo("Unable to create signed invite");
    } finally {
      setInviteBusy(false);
    }
  }

  async function acceptInvite() {
    if (!inviteCode) return;

    const token = getAccessToken();
    if (!token) {
      setInviteInfo("Log in to accept invite links");
      return;
    }

    setInviteBusy(true);
    try {
      const response = await apiPost<InviteAcceptResponse>(
        `/invites/${encodeURIComponent(inviteCode)}/accept`,
        undefined,
        { token }
      );
      setRoom(response.invite.roomCode);
      setInviteInfo(`Invite accepted as ${response.invite.seat}`);
    } catch {
      setInviteInfo("Unable to accept invite");
    } finally {
      setInviteBusy(false);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  useEffect(() => {
    if (!mounted) return;
    setOrientation(settings.boardOrientation);
  }, [mounted, settings.boardOrientation]);

  useEffect(() => {
    if (!mounted) return;

    if (!canAttemptConnect) {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryAttemptRef.current = 0;
      return;
    }

    if (!connected) connect();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, canAttemptConnect, room, connected]);

  return (
    <main className="page-shell">
      <header className="topbar shell-card">
        <h1>Chess Championship Arena</h1>
        <p>Live competitive board with direct WebSocket play.</p>
      </header>

      <section className="panel arena-status shell-card">
        <div className="arena-status-row">
          <div className="arena-status-left">
            <div className={`pill ${connected ? "ok" : "warn"}`}>{connected ? "Live" : "Offline"}</div>
            <div className="arena-status-text">
              <div className="arena-status-title">Room: {room}</div>
              <div className="arena-status-sub">{status}</div>
            </div>
          </div>

          {!connected ? (
            <button onClick={connect} className="control-btn">
              Connect
            </button>
          ) : (
            <button onClick={disconnect} className="control-btn">
              Disconnect
            </button>
          )}
        </div>

        <details className="arena-details">
          <summary>Connection settings</summary>
          <div className="controls-row arena-controls">
            <input
              aria-label="Room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="championship-1"
            />
            <select
              aria-label="Play mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "guest" | "account")}
            >
              <option value="guest">Play as Guest</option>
              <option value="account">Play with Account (coming soon)</option>
            </select>
            {mode === "guest" ? (
              <input
                aria-label="Guest display name"
                value={guestProfile.displayName}
                onChange={(e) => setGuestDisplayName(e.target.value)}
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
            </div>

            <div className="invite-strip">
              <input readOnly value={inviteLink} aria-label="Invite link" />
              <button onClick={copyInviteLink} className="control-btn" type="button">
                Copy Invite Link
              </button>
              <button onClick={createSignedInvite} className="control-btn" type="button" disabled={inviteBusy}>
                Create Signed Invite
              </button>
              {inviteCode ? (
                <button onClick={acceptInvite} className="control-btn" type="button" disabled={inviteBusy}>
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

      <section className="board-wrap" aria-label="Chess board">
        <ChessBoard
          orientation={orientation}
          onOrientationChange={setOrientation}
          remoteMove={remoteMove}
          onLocalMove={(mv) => {
            const socket = socketRef.current;
            if (!socket || socket.readyState !== WebSocket.OPEN) return;
            socket.send(
              JSON.stringify({
                type: "move",
                from: mv.from,
                to: mv.to,
                ...(mv.promotion ? { promotion: mv.promotion } : {}),
              })
            );
          }}
        />
      </section>
    </main>
  );
}
