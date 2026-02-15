"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";

type PromotionPiece = "q" | "r" | "b" | "n";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const pieceImage: Record<`w${PieceSymbol}` | `b${PieceSymbol}`, string> = {
  wp: "/pieces/w_pawn.png",
  wn: "/pieces/w_knight.png",
  wb: "/pieces/w_bishop.png",
  wr: "/pieces/w_rook.png",
  wq: "/pieces/w_queen.png",
  wk: "/pieces/w_king.png",
  bp: "/pieces/b_pawn.png",
  bn: "/pieces/b_knight.png",
  bb: "/pieces/b_bishop.png",
  br: "/pieces/b_rook.png",
  bq: "/pieces/b_queen.png",
  bk: "/pieces/b_king.png",
};

function toSquare(file: number, rank: number): Square {
  return `${files[file - 1]}${rank}` as Square;
}

export default function Home() {
  const [chess] = useState(() => {
    const instance = new Chess();
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("chess_fen");
      if (stored) {
        instance.load(stored);
      }
    }
    return instance;
  });
  const socketRef = useRef<WebSocket | null>(null);
  const [fen, setFen] = useState(chess.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [wsUrl, setWsUrl] = useState("ws://127.0.0.1:8080");
  const [room, setRoom] = useState("championship-1");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    remote: boolean;
  } | null>(null);
  const [remotePendingFrom, setRemotePendingFrom] = useState<Square | null>(null);

  const board = chess.board();

  useEffect(() => {
    window.localStorage.setItem("chess_fen", fen);
  }, [fen]);

  function broadcast(message: object) {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  function refreshBoard() {
    setFen(chess.fen());
    setLegalTargets([]);
    setSelected(null);
  }

  function movePiece(from: Square, to: Square, promotion: PromotionPiece = "q", remote = false) {
    const move = chess.move({ from, to, promotion });
    if (!move) return false;

    refreshBoard();

    if (!remote) {
      broadcast({ type: "move", from, to, promotion });
    }

    return true;
  }

  function tryMove(from: Square, to: Square, remote = false) {
    const legalMoves = chess.moves({ square: from, verbose: true });
    const chosen = legalMoves.find((mv) => mv.to === to);
    if (!chosen) return;

    if (chosen.promotion) {
      setPendingPromotion({ from, to, remote });
      return;
    }

    movePiece(from, to, "q", remote);
  }

  function onSquareClick(square: Square) {
    const current = chess;
    const piece = current.get(square);

    if (!selected) {
      if (!piece || piece.color !== current.turn()) return;
      setSelected(square);
      setLegalTargets(current.moves({ square, verbose: true }).map((mv) => mv.to));
      return;
    }

    if (selected === square) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    if (legalTargets.includes(square)) {
      tryMove(selected, square);
      return;
    }

    if (piece && piece.color === current.turn()) {
      setSelected(square);
      setLegalTargets(current.moves({ square, verbose: true }).map((mv) => mv.to));
      return;
    }

    setSelected(null);
    setLegalTargets([]);
  }

  function connect() {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setStatus("Connected");
      socket.send(JSON.stringify({ type: "join", room }));
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
      socketRef.current = null;
    };

    socket.onerror = () => {
      setStatus("Connection error");
    };

    socket.onmessage = (event) => {
      const raw = String(event.data);

      try {
        const message = JSON.parse(raw) as {
          type?: string;
          from?: Square;
          to?: Square;
          promotion?: PromotionPiece;
          room?: string;
        };

        if (message.type === "move" && message.from && message.to) {
          movePiece(message.from, message.to, message.promotion ?? "q", true);
          return;
        }

        if (message.type === "join" && message.room) {
          setStatus(`Connected (room: ${message.room})`);
          return;
        }
      } catch {
        // Backward compatibility with old relay protocol.
      }

      if (/^[1-8][1-8]$/.test(raw)) {
        const file = Number(raw[0]);
        const rank = Number(raw[1]);
        const square = toSquare(file, rank);

        if (!remotePendingFrom) {
          setRemotePendingFrom(square);
          return;
        }

        tryMove(remotePendingFrom, square, true);
        setRemotePendingFrom(null);
      }
    };
  }

  function disconnect() {
    socketRef.current?.close();
  }

  function resetGame() {
    chess.reset();
    refreshBoard();
  }

  const renderedRanks = orientation === "white" ? ranks : [...ranks].reverse();
  const renderedFiles = orientation === "white" ? files : [...files].reverse();

  return (
    <main className="page-shell">
      <header className="topbar">
        <h1>Chess Championship Arena</h1>
        <p>Responsive Next.js frontend with WebSocket relay support</p>
      </header>

      <section className="panel">
        <div className="controls-row">
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
            placeholder="room"
          />
          {!connected ? (
            <button onClick={connect}>Connect</button>
          ) : (
            <button onClick={disconnect}>Disconnect</button>
          )}
        </div>

        <div className="controls-row small">
          <button onClick={resetGame}>New Game</button>
          <button
            onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
          >
            Flip Board
          </button>
          <span className="status">{status}</span>
        </div>
      </section>

      <section className="board-wrap" aria-label="Chess board">
        <div className="board-grid">
          {renderedRanks.map((rank, rowIndex) =>
            renderedFiles.map((file, colIndex) => {
              const square = `${file}${rank}` as Square;
              const fileIdx = files.indexOf(file);
              const rankIdx = 8 - rank;
              const piece = board[rankIdx][fileIdx];

              const dark = (rowIndex + colIndex) % 2 === 1;
              const isSelected = selected === square;
              const isLegal = legalTargets.includes(square);

              return (
                <button
                  key={square}
                  className={`square ${dark ? "dark" : "light"} ${
                    isSelected ? "selected" : ""
                  } ${isLegal ? "legal" : ""}`}
                  onClick={() => onSquareClick(square)}
                  aria-label={square}
                >
                  {piece ? (
                    <img
                      src={pieceImage[`${piece.color}${piece.type}`]}
                      alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`}
                      draggable={false}
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </section>

      {pendingPromotion ? (
        <div className="promotion-modal">
          <div className="promotion-card">
            <h2>Choose Promotion</h2>
            <div className="promo-grid">
              {(["q", "r", "b", "n"] as PromotionPiece[]).map((promo) => {
                const turn = chess.turn() === "w" ? "w" : "b";
                return (
                  <button
                    key={promo}
                    onClick={() => {
                      const pending = pendingPromotion;
                      setPendingPromotion(null);
                      movePiece(pending.from, pending.to, promo, pending.remote);
                    }}
                  >
                    <img src={pieceImage[`${turn}${promo}`]} alt={promo} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
