import type { PlayerIdentity } from "../protocol.js";

type MoveAuthorizationResult = {
  ok: boolean;
  enforced: boolean;
  seat: "white" | "black" | "spectator";
  nextTurn?: "white" | "black";
  reason?: string;
};

export async function authorizeAndAdvanceMove(
  apiOrigin: string,
  sharedSecret: string,
  room: string,
  player: PlayerIdentity
): Promise<MoveAuthorizationResult> {
  const response = await fetch(
    `${apiOrigin.replace(/\/$/, "")}/internal/ws/rooms/${encodeURIComponent(room)}/authorize-move`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-ws-secret": sharedSecret,
      },
      body: JSON.stringify({ player }),
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      enforced: true,
      seat: "spectator",
      reason: `internal verification failed (${response.status})`,
    };
  }

  const body = (await response.json()) as MoveAuthorizationResult;
  return body;
}
