import { useCallback, useEffect, useRef, useState } from "react";
import type { Square } from "chess.js";

import type { PlayerMode } from "../lib/usePlayerIdentity";

type GuestProfile = {
  id: string;
  displayName: string;
};

type AccountProfile = {
  id: string;
  username: string;
};

type RemoteMove = {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
  nonce: number;
};

type MoveSnapshot = {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
};

type RealtimeState = {
  connected: boolean;
  status: string;
  lastWsError: string | null;
  peersInRoom: number;
  seat: "white" | "black" | "spectator" | null;
  turn: "white" | "black";
  historySnapshot: { moves: MoveSnapshot[]; nonce: number } | null;
  remoteMove: RemoteMove | null;
  connect: () => void;
  disconnect: () => void;
  sendMove: (move: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }) => void;
};

export function useArenaRealtime({
  wsUrl,
  room,
  mode,
  guestProfile,
  accountProfile,
  preferredSeat,
  canAttemptConnect,
}: {
  wsUrl: string;
  room: string;
  mode: PlayerMode;
  guestProfile: GuestProfile;
  accountProfile: AccountProfile | null;
  preferredSeat: "white" | "black" | "spectator" | null;
  canAttemptConnect: boolean;
}): RealtimeState {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [lastWsError, setLastWsError] = useState<string | null>(null);
  const [peersInRoom, setPeersInRoom] = useState(0);
  const [seat, setSeat] = useState<"white" | "black" | "spectator" | null>(null);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [historySnapshot, setHistorySnapshot] = useState<{ moves: MoveSnapshot[]; nonce: number } | null>(null);
  const [remoteMove, setRemoteMove] = useState<RemoteMove | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const remotePendingFrom = useRef<Square | null>(null);
  const remoteNonceRef = useRef(0);

  const connect = useCallback(() => {
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
            userId: accountProfile?.id,
            username: accountProfile?.username,
            preferredSeat: preferredSeat ?? undefined,
          },
        })
      );
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
      setPeersInRoom(0);
      setSeat(null);
      socketRef.current = null;

      if (canAttemptConnect) {
        if (retryTimerRef.current) return;

        const attempt = retryAttemptRef.current;
        const delayMs = Math.min(10_000, 750 * Math.pow(1.6, attempt));
        retryAttemptRef.current = attempt + 1;

        setStatus(`Reconnecting in ${Math.ceil(delayMs / 1000)}s...`);
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          connectRef.current?.();
        }, delayMs);
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
          seat?: "white" | "black" | "spectator";
          turn?: "white" | "black";
          moves?: MoveSnapshot[];
          message?: string;
          from?: Square;
          to?: Square;
          promotion?: "q" | "r" | "b" | "n";
        };

        if (message.type === "joined" && message.room) {
          setPeersInRoom(typeof message.peers === "number" ? message.peers : 0);
          setSeat(message.seat ?? null);
          setTurn(message.turn === "black" ? "black" : "white");
          setHistorySnapshot({
            moves: Array.isArray(message.moves) ? message.moves : [],
            nonce: Date.now(),
          });
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
          if (message.turn === "white" || message.turn === "black") {
            setTurn(message.turn);
          }
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
        // Ignore parse errors from non-JSON relay messages.
      }

      if (/^[1-8][1-8]$/.test(raw)) {
        const file = Number(raw[0]);
        const rank = Number(raw[1]);
        const square = `${String.fromCharCode("a".charCodeAt(0) + (file - 1))}${rank}` as Square;

        if (!remotePendingFrom.current) {
          remotePendingFrom.current = square;
          return;
        }

        remoteNonceRef.current += 1;
        setRemoteMove({ from: remotePendingFrom.current, to: square, nonce: remoteNonceRef.current });
        remotePendingFrom.current = null;
      }
    };
  }, [
    accountProfile?.id,
    accountProfile?.username,
    canAttemptConnect,
    guestProfile.displayName,
    guestProfile.id,
    mode,
    preferredSeat,
    room,
    wsUrl,
  ]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryAttemptRef.current = 0;
    socketRef.current?.close();
  }, []);

  const sendMove = useCallback((move: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "move",
        from: move.from,
        to: move.to,
        ...(move.promotion ? { promotion: move.promotion } : {}),
      })
    );
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!canAttemptConnect) {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryAttemptRef.current = 0;
      return;
    }

    let initialConnectTimer: ReturnType<typeof setTimeout> | null = null;

    if (!connected) {
      initialConnectTimer = setTimeout(() => {
        connectRef.current?.();
      }, 0);
    }

    return () => {
      if (initialConnectTimer) {
        clearTimeout(initialConnectTimer);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [canAttemptConnect, connected]);

  return {
    connected,
    status,
    lastWsError,
    peersInRoom,
    seat,
    turn,
    historySnapshot,
    remoteMove,
    connect,
    disconnect,
    sendMove,
  };
}
