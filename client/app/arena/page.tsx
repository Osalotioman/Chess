"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChessBoard } from "../components/ChessBoard";
import { useSettings } from "../lib/useSettings";
import type { Square } from "chess.js";

export default function ArenaPage() {
  const { settings, mounted } = useSettings();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [wsUrl, setWsUrl] = useState("https://chess-championship-arena.onrender.com"); //ws://127.0.0.1:8080
  const [room, setRoom] = useState("championship-1");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
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

  const autoConnectEnabled = mounted ? settings.autoConnect : false;
  const canAttemptConnect = useMemo(() => {
    if (!autoConnectEnabled) return false;
    if (!wsUrl.trim() || !room.trim()) return false;
    return true;
  }, [autoConnectEnabled, room, wsUrl]);

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

    socket.onopen = () => {
      setConnected(true);
      setStatus("Connected");
      retryAttemptRef.current = 0;
      socket.send(JSON.stringify({ type: "join", room }));
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
      socketRef.current = null;

      if (canAttemptConnect) {
        scheduleRetry();
      }
    };

    socket.onerror = () => {
      setStatus("Connection error");
    };

    socket.onmessage = (event) => {
      const raw = String(event.data);

      try {
        const message = JSON.parse(raw) as {
          type?: string;
          room?: string;
          from?: Square;
          to?: Square;
          promotion?: "q" | "r" | "b" | "n";
        };

        if (message.type === "join" && message.room) {
          setStatus(`Connected (room: ${message.room})`);
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
  }, [mounted, canAttemptConnect, wsUrl, room, connected]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <h1>Chess Championship Arena</h1>
        <p>Compete in real-time chess tournaments</p>
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
              aria-label="WebSocket URL"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://127.0.0.1:8080"
            />
            <input
              aria-label="Room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="championship-1"
            />
            <div className="arena-autoconnect">
              Auto-connect: <strong>{autoConnectEnabled ? "On" : "Off"}</strong>
            </div>
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
