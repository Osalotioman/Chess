-- Add terminal lifecycle fields to existing game sessions
ALTER TABLE "game_sessions"
ADD COLUMN "winnerSeat" "PieceColor",
ADD COLUMN "terminationReason" TEXT,
ADD COLUMN "endedAt" TIMESTAMP(3);

-- Persist canonical move history for replay and audit flows
CREATE TABLE "game_moves" (
	"id" TEXT NOT NULL,
	"gameSessionId" TEXT NOT NULL,
	"ply" INTEGER NOT NULL,
	"fromSquare" TEXT NOT NULL,
	"toSquare" TEXT NOT NULL,
	"promotion" TEXT,
	"seat" "PieceColor" NOT NULL,
	"playerUserId" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "game_moves_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_moves_gameSessionId_ply_key" ON "game_moves"("gameSessionId", "ply");
CREATE INDEX "game_moves_gameSessionId_createdAt_idx" ON "game_moves"("gameSessionId", "createdAt");

ALTER TABLE "game_moves"
ADD CONSTRAINT "game_moves_gameSessionId_fkey"
FOREIGN KEY ("gameSessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
