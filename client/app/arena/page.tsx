"use client";

import { useEffect, useMemo, useState } from "react";
import { ChessBoard } from "@components/ChessBoard";
import { ApiError, apiGet, apiPost } from "@lib/api";
import { getAccessToken, getStoredSession } from "@lib/session";
import { usePlayerIdentity } from "@lib/usePlayerIdentity";
import { createRoomId } from "@lib/roomId";
import { useSettings } from "@lib/useSettings";
import { Button } from "@components/ui/button";
import { ArenaSidebar } from "./ArenaSidebar";
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
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    lastWsError,
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
        if (!response.invite.active) {
          setInviteInfo("Invite is no longer active");
          return;
        }

        if (response.invite.kind === "player" && response.invite.seatsFull) {
          setInviteInfo("Game already has two players. Ask for a spectator invite link.");
          return;
        }

        setInviteInfo(
          response.invite.kind === "spectator"
            ? "Spectator invite ready. You will join as a watcher."
            : "Player invite ready to join"
        );
      })
      .catch((error) => {
        if (!active) return;
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

  async function acceptInvite() {
    if (!inviteCode) return;

    const token = getAccessToken();
    if (!token) {
      setMode("guest");
      setSetupApplied(true);
      if (inviteKind === "spectator") {
        setSeat("spectator");
      } else {
        setSeat(null);
      }
      setInviteInfo(
        "You are not logged in. Joining as guest; this game will not be linked to an account profile."
      );
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
      setInviteInfo(`Invite accepted as ${response.invite.seat}`);
    } catch (error) {
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

  useEffect(() => {
    if (!isSidebarOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <main className="grid min-h-[calc(100svh-52px)] gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <ArenaSidebar
        isOpen={isSidebarOpen}
        connected={connected}
        room={room}
        status={status}
        mode={mode}
        guestProfile={guestProfile}
        autoConnectEnabled={autoConnectEnabled}
        peersInRoom={peersInRoom}
        wsUrl={wsUrl}
        lastWsError={lastWsError}
        inviteLink={inviteLink}
        inviteCode={inviteCode}
        inviteBusy={inviteBusy}
        copyStatus={copyStatus}
        inviteInfo={inviteInfo}
        seat={seat}
        hostSeat={hostSeat}
        firstTurn={firstTurn}
        inviteKind={inviteKind}
        setupApplied={setupApplied}
        onRoomChange={setRoom}
        onModeChange={setMode}
        onGuestNameChange={setGuestDisplayName}
        onHostSeatChange={setHostSeat}
        onFirstTurnChange={setFirstTurn}
        onInviteKindChange={setInviteKind}
        onApplySetup={applySetup}
        onCreateRoom={createGameRoom}
        onConnect={connect}
        onDisconnect={disconnect}
        onCopyInvite={copyInviteLink}
        onCreateSignedInvite={createSignedInvite}
        onAcceptInvite={acceptInvite}
        onAbortGame={abortCurrentGame}
      />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close arena sidebar"
          className="fixed inset-0 z-10 border-0 bg-black/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <section
        className="grid min-h-[calc(100svh-6.5rem)] grid-rows-[auto_1fr] gap-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-3 shadow-2xl sm:min-h-[calc(100svh-6rem)]"
        aria-label="Arena board stage"
      >
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            className="lg:hidden"
            type="button"
            aria-label="Open arena menu"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((current) => !current)}
          >
            <span className="inline-grid gap-1" aria-hidden="true">
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
              <span className="block h-0.5 w-4 rounded bg-slate-100" />
            </span>
            Menu
          </Button>

          <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 sm:rounded-full">
            <span
              className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                connected
                  ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-100"
                  : "border-rose-300/60 bg-rose-300/10 text-rose-100"
              }`}
            >
              {connected ? "Live" : "Offline"}
            </span>
            {seat ? <span className="rounded-full border border-slate-600 px-2 py-1">Seat: {seat}</span> : null}
            <span className="max-w-[180px] truncate sm:max-w-none">
              Room <strong>{room}</strong>
            </span>
          </div>
        </div>

        <section className="grid min-h-0 place-items-center" aria-label="Chess board">
          <ChessBoard
            orientation={orientation}
            onOrientationChange={setOrientation}
            syncRoom={room}
            historySnapshot={historySnapshot}
            remoteMove={remoteMove}
            onLocalMove={(move) => {
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
        </section>
      </section>
    </main>
  );
}
