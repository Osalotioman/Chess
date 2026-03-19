"use client";

import Link from "next/link";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { FriendsInvitesSection } from "./FriendsInvitesSection";
import { PlayerDirectorySection } from "./PlayerDirectorySection";
import { useLobbySocial } from "./useLobbySocial";

export default function LobbyPage() {
  const {
    query,
    setQuery,
    isLoading,
    loadError,
    filteredPlayers,
    friends,
    incomingRequests,
    outgoingRequests,
    pendingRequests,
    lastInviteLink,
    requestFriend,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    inviteFriend,
  } = useLobbySocial();

  return (
    <main className="grid min-h-[calc(100svh-52px)] grid-rows-[auto_auto_1fr] gap-3 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1>Player Lobby</h1>
        <p className="text-sm text-slate-300">Find players, build your friends list, and invite someone to a match.</p>
      </header>

      <section className="grid items-center gap-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-3 shadow-xl md:grid-cols-[1fr_auto]">
        <Input
          aria-label="Search players"
          placeholder="Search by player name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button asChild>
          <Link href="/arena">Go to Arena</Link>
        </Button>
      </section>

      {isLoading ? <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-slate-300">Loading player directory...</div> : null}
      {loadError ? <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-rose-200">{loadError}</div> : null}

      <section className="grid gap-3 lg:grid-cols-2">
        <PlayerDirectorySection
          players={filteredPlayers}
          pendingRequests={pendingRequests}
          onRequestFriend={requestFriend}
        />

        <FriendsInvitesSection
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          friends={friends}
          lastInviteLink={lastInviteLink}
          onAcceptRequest={acceptRequest}
          onRejectRequest={rejectRequest}
          onCancelRequest={cancelRequest}
          onInviteFriend={inviteFriend}
          onRemoveFriend={removeFriend}
        />
      </section>
    </main>
  );
}
