"use client";

import { useEffect, useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { useSound } from "../lib/useSound";

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

const controlBtn =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-medium text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700";

interface ChessBoardProps {
  orientation?: "white" | "black";
  onOrientationChange?: (o: "white" | "black") => void;
  onLocalMove?: (move: { from: Square; to: Square; promotion?: PromotionPiece }) => void;
  remoteMove?: { from: Square; to: Square; promotion?: PromotionPiece; nonce: number } | null;
}

export function ChessBoard({
  orientation = "white",
  onOrientationChange,
  onLocalMove,
  remoteMove,
}: ChessBoardProps) {
  const [chess, setChess] = useState<Chess | null>(null);
  const [fen, setFen] = useState("");
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const { play } = useSound();

  // Initialize chess on client only
  useEffect(() => {
    const instance = new Chess();
    const stored = window.localStorage.getItem("chess_fen");
    if (stored) {
      instance.load(stored);
    }
    setChess(instance);
    setFen(instance.fen());
  }, []);

  // Persist FEN to localStorage
  useEffect(() => {
    if (!chess) return;
    window.localStorage.setItem("chess_fen", fen);
  }, [fen, chess]);

  const game = chess;

  function refreshBoard(current: Chess) {
    setFen(current.fen());
    setLegalTargets([]);
    setSelected(null);
  }

  function movePiece(
    from: Square,
    to: Square,
    promotion?: PromotionPiece,
    remote = false
  ) {
    if (!game) return false;
    const current = game;

    const wasCapture = current.get(to) !== null;
    let move:
      | {
          flags: string;
        }
      | null = null;

    try {
      move = current.move(promotion ? { from, to, promotion } : { from, to });
    } catch {
      return false;
    }
    if (!move) return false;

    setLastMove([from, to]);
    refreshBoard(current);

    // Play sounds
    const anyChess = current as unknown as {
      isCheckmate?: () => boolean;
      in_checkmate?: () => boolean;
      isStalemate?: () => boolean;
      in_stalemate?: () => boolean;
      isCheck?: () => boolean;
      in_check?: () => boolean;
    };

    const isGameOver =
      (typeof anyChess.isCheckmate === "function" && anyChess.isCheckmate()) ||
      (typeof anyChess.in_checkmate === "function" && anyChess.in_checkmate()) ||
      (typeof anyChess.isStalemate === "function" && anyChess.isStalemate()) ||
      (typeof anyChess.in_stalemate === "function" && anyChess.in_stalemate());

    const isCheck =
      (typeof anyChess.isCheck === "function" && anyChess.isCheck()) ||
      (typeof anyChess.in_check === "function" && anyChess.in_check());

    if (isGameOver) {
      play("win");
    } else if (isCheck) {
      play("check");
    } else if (wasCapture || move.flags.includes("c")) {
      play("capture");
    } else if (move.flags.includes("k") || move.flags.includes("q")) {
      play("castling");
    } else {
      play("move");
    }

    if (!remote) {
      onLocalMove?.({ from, to, promotion });
    }

    return true;
  }

  function tryMove(from: Square, to: Square) {
    if (!game) return;
    const legalMoves = game.moves({ square: from, verbose: true });
    const chosen = legalMoves.find((mv) => mv.to === to);
    if (!chosen) return;

    if (chosen.promotion) {
      setPendingPromotion({ from, to });
      return;
    }

    movePiece(from, to, undefined, false);
  }

  // Apply remote move when it changes.
  useEffect(() => {
    if (!game) return;
    if (!remoteMove) return;
    movePiece(remoteMove.from, remoteMove.to, remoteMove.promotion, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMove?.nonce]);

  function onSquareClick(square: Square) {
    if (!game) return;
    const piece = game.get(square);

    if (!selected) {
      if (!piece || piece.color !== game.turn()) return;
      setSelected(square);
      setLegalTargets(game.moves({ square, verbose: true }).map((mv) => mv.to));
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

    if (piece && piece.color === game.turn()) {
      setSelected(square);
      setLegalTargets(game.moves({ square, verbose: true }).map((mv) => mv.to));
      return;
    }

    setSelected(null);
    setLegalTargets([]);
  }

  function resetGame() {
    if (!game) return;
    game.reset();
    setFen(game.fen());
    setSelected(null);
    setLegalTargets([]);
    setLastMove(null);
  }

  if (!game) {
    return <div className="aspect-square w-[min(94vw,78svh,880px)] rounded-xl border-2 border-slate-500 bg-slate-700/40" />;
  }

  const board = game.board();
  const renderedRanks = orientation === "white" ? ranks : [...ranks].reverse();
  const renderedFiles = orientation === "white" ? files : [...files].reverse();

  const whiteKingSquare = board.flat().findIndex((p) => p && p.color === "w" && p.type === "k");
  const blackKingSquare = board.flat().findIndex((p) => p && p.color === "b" && p.type === "k");
  const inCheck = (() => {
    const anyChess = game as unknown as {
      isCheck?: () => boolean;
      in_check?: () => boolean;
      inCheck?: () => boolean;
    };

    if (typeof anyChess.isCheck === "function") return anyChess.isCheck();
    if (typeof anyChess.in_check === "function") return anyChess.in_check();
    if (typeof anyChess.inCheck === "function") return anyChess.inCheck();
    return false;
  })();

  const whiteInCheck = inCheck && game.turn() === "w";
  const blackInCheck = inCheck && game.turn() === "b";

  return (
    <>
      <div className="grid aspect-square w-[min(94vw,78svh,880px)] grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border-2 border-slate-500">
        {renderedRanks.map((rank, rowIndex) =>
          renderedFiles.map((file, colIndex) => {
            const square = `${file}${rank}` as Square;
            const fileIdx = files.indexOf(file);
            const rankIdx = 8 - rank;
            const piece = board[rankIdx][fileIdx];

            const dark = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selected === square;
            const isLegal = legalTargets.includes(square);
            const squareIndex = rankIdx * 8 + fileIdx;
            const isWhiteKingSquare = whiteKingSquare === squareIndex && whiteInCheck;
            const isBlackKingSquare = blackKingSquare === squareIndex && blackInCheck;
            const isInCheck = isWhiteKingSquare || isBlackKingSquare;
            const isLastMoveFrom = lastMove && lastMove[0] === square;
            const isLastMoveTo = lastMove && lastMove[1] === square;

            return (
              <button
                key={square}
                className={`relative grid place-items-center border-2 p-0 transition ${
                  dark ? "bg-[#5f7ba3]" : "bg-[#d8e0ef]"
                } ${isSelected ? "border-amber-300" : "border-transparent"} ${
                  isLegal ? "ring-1 ring-emerald-300/90" : ""
                } ${isInCheck ? "ring-2 ring-rose-400" : ""} ${
                  isLastMoveFrom || isLastMoveTo ? "ring-2 ring-yellow-300/85" : ""
                }`}
                onClick={() => onSquareClick(square)}
                aria-label={square}
              >
                {piece ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pieceImage[`${piece.color}${piece.type}`]}
                    alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`}
                    draggable={false}
                    className="h-[88%] w-[88%] object-contain select-none"
                  />
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={resetGame} className={controlBtn}>
          New Game
        </button>
        <button
          onClick={() => onOrientationChange?.(orientation === "white" ? "black" : "white")}
          className={controlBtn}
        >
          Flip Board
        </button>
      </div>

      {pendingPromotion ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-900 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-100">Choose Promotion</h2>
            <div className="grid grid-cols-4 gap-2">
              {(["q", "r", "b", "n"] as PromotionPiece[]).map((promo) => {
                const turn = game.turn() === "w" ? "w" : "b";
                return (
                  <button
                    key={promo}
                    className="rounded-lg border border-slate-600 bg-slate-800 p-2 transition hover:border-emerald-300/70 hover:bg-slate-700"
                    onClick={() => {
                      const pending = pendingPromotion;
                      setPendingPromotion(null);
                      movePiece(pending.from, pending.to, promo);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pieceImage[`${turn}${promo}`]} alt={promo} className="w-full" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
