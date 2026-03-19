"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiGet, apiPost } from "@lib/api";
import { getAccessToken, getStoredSession } from "@lib/session";
import { usePlayerIdentity } from "@lib/usePlayerIdentity";
import { createRoomId } from "@lib/roomId";
import { useSettings } from "@lib/useSettings";
import { Button } from "@components/ui/button";
import { ArenaSetupPanel } from "./ArenaSetupPanel";
import { ArenaStage } from "./ArenaStage";
import type { InviteAcceptResponse, InviteCreateResponse, InviteLookupResponse } from "./types";
import { useArenaRealtime } from "./useArenaRealtime";

export default function ArenaPage() {
  const { settings, mounted } = useSettings();
  const { mode, setMode, guestProfile, setGuestDisplayName, ensureGuestProfile } = usePlayerIdentity();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [room, setRoom] = useState(createRoomId);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [seat, setSeat] = useState<"white" | "black" | "spectator" | null>(null);
  const [hostSeat, setHostSeat] = useState<"white" | "black">("white");
  const [firstTurn, setFirstTurn] = useState<"white" | "black">("white");
  const [inviteKind, setInviteKind] = useState<"player" | "spectator">("player");
  const [setupApplied, setSetupApplied] = useState(false);
  const [inviteResolved, setInviteResolved] = useState(false);
  const [autoAcceptAttempted, setAutoAcceptAttempted] = useState(false);
  const [autoAcceptDone, setAutoAcceptDone] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

  const autoConnectEnabled = mounted ? settings.autoConnect : false;
  const canAttemptConnect = useMemo(() => {
    if (!autoConnectEnabled) return false;
    if (!room.trim()) return false;
    if (!setupApplied) return false;
    return true;
  }, [autoConnectEnabled, room, setupApplied]);

  const {
    connected,
    status,
    peersInRoom,
    seat: realtimeSeat,
    historySnapshot,
    remoteMove,
    connect,
    disconnect,
    sendMove,
  } =
    useArenaRealtime({
      wsUrl,
      room,
      mode,
      guestProfile,
      accountProfile: getStoredSession()?.user ?? null,
      preferredSeat: seat,
      canAttemptConnect,
    });

  useEffect(() => {
    ensureGuestProfile();
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const inviteFromQuery = params.get("invite");
    const roomFromQuery = params.get("room");

    if (inviteFromQuery && inviteFromQuery.trim()) {
      setInviteCode(inviteFromQuery.trim());
      setInviteResolved(false);
      setAutoAcceptAttempted(false);
    }

    if (roomFromQuery && roomFromQuery.trim()) {
      setRoom(roomFromQuery.trim());
    }
  }, [ensureGuestProfile]);

  useEffect(() => {
    if (!realtimeSeat) return;
    setSeat(realtimeSeat);
  }, [realtimeSeat]);

  useEffect(() => {
    if (!inviteCode) return;

    let active = true;
    setInviteBusy(true);
    setInviteInfo("Resolving invite...");

    apiGet<InviteLookupResponse>(`/invites/${encodeURIComponent(inviteCode)}`)
      .then((response) => {
        if (!active) return;
        setRoom(response.invite.roomCode);
        setInviteKind(response.invite.kind);
        setInviteResolved(true);
        if (!response.invite.active) {
          setSetupApplied(false);
          setInviteInfo("Invite is no longer active");
          return;
        }

        if (response.invite.kind === "player" && response.invite.seatsFull) {
          setSetupApplied(false);
          setInviteInfo("Game already has two players. Ask for a spectator invite link.");
          return;
        }

        setSetupApplied(true);
        if (response.invite.kind === "spectator") {
          setSeat("spectator");
        } else {
          const whiteTaken = Boolean(response.invite.seats?.whitePlayerId);
          const blackTaken = Boolean(response.invite.seats?.blackPlayerId);
          if (whiteTaken && !blackTaken) {
            setSeat("black");
          } else if (blackTaken && !whiteTaken) {
            setSeat("white");
          } else {
            setSeat(null);
          }
        }

        setInviteInfo(
          response.invite.kind === "spectator"
            ? "Spectator invite ready. Entering game as watcher."
            : "Player invite ready. Entering game and syncing with host."
        );
      })
      .catch((error) => {
        if (!active) return;
        setInviteResolved(false);
        setSetupApplied(false);
        if (error instanceof ApiError) {
          setInviteInfo(error.message);
          return;
        }
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
    if (!inviteCode || !inviteResolved) return;
    if (autoAcceptAttempted) return;

    setAutoAcceptAttempted(true);
    void acceptInvite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, inviteResolved, autoAcceptAttempted]);

  useEffect(() => {
    if (copyStatus === "idle") return;

    const timer = setTimeout(() => {
      setCopyStatus("idle");
    }, 2200);

    return () => clearTimeout(timer);
  }, [copyStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const link = inviteCode
      ? `${origin}/arena?invite=${encodeURIComponent(inviteCode)}`
      : `${origin}/arena?room=${encodeURIComponent(room.trim() || createRoomId())}`;
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
          inviteKind,
          hostSeat,
          firstTurn,
        },
        { token }
      );
      setInviteCode(response.invite.code);
      setInviteKind(response.invite.kind);
      setRoom(response.invite.roomCode);
      setSetupApplied(true);
      setSeat(hostSeat);
      setInviteInfo(`Signed ${response.invite.kind} invite created`);
    } catch {
      setInviteInfo(
        inviteKind === "player"
          ? "Unable to create player invite. If room is full, switch invite kind to spectator."
          : "Unable to create signed invite"
      );
    } finally {
      setInviteBusy(false);
    }
  }

  async function acceptInvite(auto = false) {
    if (!inviteCode) return;

    const token = getAccessToken();
    if (!token) {
      setMode("guest");
      setSetupApplied(true);
      if (inviteKind === "spectator") {
        setSeat("spectator");
      }
      if (!auto) {
        setInviteInfo(
          "You are not logged in. Joining as guest; this game will not be linked to an account profile."
        );
      }
      setAutoAcceptDone(true);
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
      setSeat(response.invite.seat);
      setInviteKind(response.invite.kind);
      setSetupApplied(true);
      setInviteInfo(`Invite accepted as ${response.invite.seat}. Waiting for realtime sync...`);
      setAutoAcceptDone(true);
    } catch (error) {
      if (auto) {
        setAutoAcceptDone(true);
        return;
      }
      if (error instanceof ApiError) {
        setInviteInfo(error.message);
      } else {
        setInviteInfo("Unable to accept invite");
      }
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

  async function abortCurrentGame() {
    if (!room.trim()) return;

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Abort this game? Aborting immediately ends the game and gives the other player the win when applicable."
      );
      if (!confirmed) return;
    }

    const token = getAccessToken();
    if (!token) {
      setInviteInfo("You are playing as guest. Local abort only: disconnecting from room.");
      disconnect();
      return;
    }

    setInviteBusy(true);
    try {
      const response = await apiPost<{
        result: {
          roomCode: string;
          status: string;
          abortedBySeat: "white" | "black";
          winnerSeat: "white" | "black" | null;
        };
      }>(`/games/${encodeURIComponent(room.trim())}/abort`, undefined, { token });

      setInviteInfo(
        response.result.winnerSeat
          ? `Game aborted by ${response.result.abortedBySeat}. ${response.result.winnerSeat} wins.`
          : `Game aborted by ${response.result.abortedBySeat}.`
      );
      disconnect();
    } catch (error) {
      if (error instanceof ApiError) {
        setInviteInfo(error.message);
      } else {
        setInviteInfo("Unable to abort game");
      }
    } finally {
      setInviteBusy(false);
    }
  }

  function createGameRoom() {
    const nextRoom = createRoomId();
    setRoom(nextRoom);
    setInviteCode(null);
    setInviteResolved(false);
    setAutoAcceptAttempted(false);
    setAutoAcceptDone(false);
    setSeat(null);
    setInviteKind("player");
    setSetupApplied(false);
    setInviteInfo(`Created room ${nextRoom}`);
  }

  function applySetup() {
    setSeat(hostSeat);
    setSetupApplied(true);
    setInviteInfo(`Setup applied. Host seat: ${hostSeat}, first turn: ${firstTurn}`);
  }

  useEffect(() => {
    if (!mounted) return;
    setOrientation(settings.boardOrientation);
  }, [mounted, settings.boardOrientation]);

  function returnToSetup() {
    disconnect();
    setSetupApplied(false);
  }

  const joiningInvite =
    Boolean(inviteCode) && (!inviteResolved || (inviteResolved && autoAcceptAttempted && !autoAcceptDone));

  if (joiningInvite) {
    return (
      <main className="min-h-[calc(100svh-52px)] grid place-items-center p-4">
        <section className="w-full max-w-lg rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-6 text-center shadow-2xl">
          <p className="text-xs tracking-[0.16em] text-slate-400 uppercase">Joining Match</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Preparing your game</h1>
          <p className="mt-2 text-sm text-slate-300">
            Validating invite and syncing seat assignment. You will enter the board automatically.
          </p>
          <div className="mx-auto mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-300/80" />
          </div>
        </section>
      </main>
    );
  }

  if (!setupApplied) {
    return (
      <main className="min-h-[calc(100svh-52px)] p-3 sm:p-4">
        <ArenaSetupPanel
        room={room}
        mode={mode}
        guestProfile={guestProfile}
          inviteCode={inviteCode}
          inviteKind={inviteKind}
          inviteBusy={inviteBusy}
          inviteInfo={inviteInfo}
        inviteLink={inviteLink}
        copyStatus={copyStatus}
        hostSeat={hostSeat}
        firstTurn={firstTurn}
          onRoomChange={setRoom}
          onModeChange={setMode}
          onGuestNameChange={setGuestDisplayName}
          onHostSeatChange={setHostSeat}
          onFirstTurnChange={setFirstTurn}
          onInviteKindChange={setInviteKind}
          onCreateRoom={createGameRoom}
          onApplySetup={applySetup}
          onCreateSignedInvite={createSignedInvite}
          onCopyInvite={copyInviteLink}
          onAcceptInvite={() => {
            void acceptInvite(false);
          }}
        />
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100svh-52px)] grid-rows-[auto_1fr] gap-3 p-3 sm:gap-4 sm:p-4">
      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-3">
        <span className="text-xs text-slate-300">
          Room <strong>{room}</strong>
        </span>
        <span className="text-xs text-slate-300">
          Seat <strong>{seat ?? "unassigned"}</strong>
        </span>
        <span className="text-xs text-slate-300">
          Peers <strong>{peersInRoom}</strong>
        </span>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
            connected
              ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-100"
              : "border-rose-300/60 bg-rose-300/10 text-rose-100"
          }`}
        >
          {connected ? "Live" : status}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={copyInviteLink} variant="secondary" type="button">
            {copyStatus === "copied" ? "Invite Copied" : "Copy Invite"}
          </Button>
          {!connected ? (
            <Button onClick={connect} variant="secondary" type="button">
              Connect
            </Button>
          ) : (
            <Button onClick={disconnect} variant="secondary" type="button">
              Disconnect
            </Button>
          )}
          <Button onClick={returnToSetup} variant="secondary" type="button">
            Setup Screen
          </Button>
          <Button
            onClick={() => {
              void abortCurrentGame();
            }}
            variant="secondary"
            type="button"
            disabled={inviteBusy || !seat || seat === "spectator"}
          >
            Abort Game
          </Button>
        </div>
      </section>

      {inviteInfo ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
          {inviteInfo}
        </p>
      ) : null}

      {!connected ? (
        <p className="rounded-lg border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
          You are disconnected. Moves are locked until realtime connection is restored.
        </p>
      ) : null}

      {connected && seat !== "spectator" && peersInRoom < 2 ? (
        <p className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Waiting for opponent to join this room.
        </p>
      ) : null}

      <ArenaStage
        connected={connected}
        seat={seat}
        room={room}
        setupApplied={setupApplied}
        isSidebarOpen={false}
        orientation={orientation}
        historySnapshot={historySnapshot}
        remoteMove={remoteMove}
        onToggleMenu={() => {}}
        showMenuButton={false}
        onOrientationChange={setOrientation}
        onLocalMove={(move) => {
          if (!connected) {
            setInviteInfo("Reconnecting... moves are locked until connection is restored.");
            return;
          }
          if (!setupApplied) {
            setInviteInfo("Apply game setup before making moves.");
            return;
          }
          if (seat === "spectator") {
            setInviteInfo("Spectators cannot make moves in this game session.");
            return;
          }
          sendMove(move);
        }}
      />
    </main>
  );
}
