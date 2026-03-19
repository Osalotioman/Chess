"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../lib/api";
import { getAccessToken } from "../lib/session";

type Player = {
  id: string;
  username: string;
  rating: number;
  online: boolean;
  isFriend?: boolean;
};

type PlayersResponse = {
  players: Array<{
    id: string;
    username: string;
    rating: number;
    online: boolean;
  }>;
};

type FriendsResponse = {
  friends: Array<{
    id: string;
    username: string;
    rating: number;
    online: boolean;
  }>;
};

type IncomingRequest = {
  id: string;
  senderId: string;
  senderUsername: string;
  senderRating: number;
  createdAt: string;
};

type OutgoingRequest = {
  id: string;
  receiverId: string;
  receiverUsername: string;
  receiverRating: number;
  createdAt: string;
};

type FriendRequestsResponse = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
};

type InviteCreateResponse = {
  invite: {
    code: string;
    roomCode: string;
    expiresAt: string;
  };
};

export default function LobbyPage() {
  const [query, setQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialVersion, setSocialVersion] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const search = query.trim();
        const searchQuery = search ? `?search=${encodeURIComponent(search)}` : "";
        const response = await apiGet<PlayersResponse>(`/players${searchQuery}`);

        if (!active) return;

        setPlayers(
          response.players.map((player) => ({
            ...player,
            isFriend: friends.some((friend) => friend.id === player.id),
          }))
        );
      } catch {
        if (!active) return;
        setLoadError("Unable to load player directory right now.");
        setPlayers([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, [query, friends]);

  useEffect(() => {
    let active = true;

    async function loadFriends() {
      const token = getAccessToken();
      if (!token) {
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        return;
      }

      try {
        const [friendsResponse, requestsResponse] = await Promise.all([
          apiGet<FriendsResponse>("/friends", { token }),
          apiGet<FriendRequestsResponse>("/friends/requests", { token }),
        ]);

        if (!active) return;
        setFriends(friendsResponse.friends);
        setIncomingRequests(requestsResponse.incoming);
        setOutgoingRequests(requestsResponse.outgoing);
      } catch {
        if (!active) return;
        setLoadError("Unable to load your social graph right now.");
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
      }
    }

    loadFriends();

    return () => {
      active = false;
    };
  }, [socialVersion]);

  const filtered = useMemo(() => {
    const friendIds = new Set(friends.map((friend) => friend.id));
    return players.map((player) => ({ ...player, isFriend: friendIds.has(player.id) }));
  }, [players, friends]);

  async function requestFriend(playerId: string) {
    if (pendingRequests.includes(playerId)) return;

    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to send friend requests.");
      return;
    }

    try {
      await apiPost("/friends/requests", { receiverUserId: playerId }, { token });
      setLoadError(null);
    } catch {
      setLoadError("Friend request endpoint unavailable. Ensure social migrations are applied.");
    }

    setPendingRequests((current) => [...current, playerId]);
    setSocialVersion((current) => current + 1);
  }

  async function acceptRequest(requestId: string) {
    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to manage friend requests.");
      return;
    }

    try {
      await apiPost(`/friends/requests/${requestId}/accept`, undefined, { token });
      setLoadError(null);
      setSocialVersion((current) => current + 1);
    } catch {
      setLoadError("Unable to accept request right now.");
    }
  }

  async function rejectRequest(requestId: string) {
    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to manage friend requests.");
      return;
    }

    try {
      await apiPost(`/friends/requests/${requestId}/reject`, undefined, { token });
      setLoadError(null);
      setSocialVersion((current) => current + 1);
    } catch {
      setLoadError("Unable to reject request right now.");
    }
  }

  async function cancelRequest(requestId: string) {
    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to manage friend requests.");
      return;
    }

    try {
      await apiPost(`/friends/requests/${requestId}/cancel`, undefined, { token });
      setLoadError(null);
      setSocialVersion((current) => current + 1);
    } catch {
      setLoadError("Unable to cancel request right now.");
    }
  }

  async function removeFriend(friendId: string) {
    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to manage friends.");
      return;
    }

    try {
      await apiDelete(`/friends/${friendId}`, { token });
      setLoadError(null);
      setSocialVersion((current) => current + 1);
    } catch {
      setLoadError("Unable to remove friend right now.");
    }
  }

  async function inviteFriend(friendId: string) {
    const token = getAccessToken();
    if (!token) {
      setLoadError("Log in to create friend invites.");
      return;
    }

    try {
      const response = await apiPost<InviteCreateResponse>(
        "/invites",
        { receiverUserId: friendId },
        { token }
      );

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/arena?invite=${encodeURIComponent(response.invite.code)}`;
      setLastInviteLink(link);
      setLoadError(null);
    } catch {
      setLoadError("Unable to create invite right now.");
    }
  }

  return (
    <main className="grid min-h-[calc(100svh-52px)] grid-rows-[auto_auto_1fr] gap-3 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1>Player Lobby</h1>
        <p className="text-sm text-slate-300">Find players, build your friends list, and invite someone to a match.</p>
      </header>

      <section className="grid items-center gap-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-3 shadow-xl md:grid-cols-[1fr_auto]">
        <input
          aria-label="Search players"
          placeholder="Search by player name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-300/70"
        />
        <Link
          href="/arena"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-300 to-teal-200 px-4 text-sm font-semibold text-slate-900"
        >
          Go to Arena
        </Link>
      </section>

      {isLoading ? <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-slate-300">Loading player directory...</div> : null}
      {loadError ? <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-rose-200">{loadError}</div> : null}

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
          <h2>Players on Platform</h2>
          <p className="mt-1 text-sm text-slate-300">Browse real player accounts and add friends directly.</p>
          <div className="mt-3 grid gap-2">
            {filtered.length === 0 ? <div className="border-t border-dashed border-slate-600 pt-2 text-sm text-slate-300">No players found.</div> : null}
            {filtered.map((player) => {
              const pending = pendingRequests.includes(player.id);
              return (
                <div className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]" key={player.id}>
                  <div>
                    <div className="font-semibold text-slate-100">{player.username}</div>
                    <div className="text-xs text-slate-300">
                      Rating {player.rating} | {player.online ? "Online" : "Offline"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isFriend ? (
                      <span className="rounded-full border border-emerald-300/70 bg-emerald-300/15 px-2 py-1 text-xs text-emerald-100">
                        Friend
                      </span>
                    ) : null}
                    {!player.isFriend ? (
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700 disabled:opacity-60"
                        onClick={() => requestFriend(player.id)}
                        disabled={pending}
                      >
                        {pending ? "Requested" : "Add Friend"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
          <h2>Friends and Invites</h2>
          <p className="mt-1 text-sm text-slate-300">Manage live friend requests and invite friends to active games.</p>

          {incomingRequests.length > 0 ? (
            <div className="mt-3 grid gap-2">
              <h3>Incoming Requests</h3>
              {incomingRequests.map((request) => (
                <div className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]" key={request.id}>
                  <div>
                    <div className="font-semibold text-slate-100">{request.senderUsername}</div>
                    <div className="text-xs text-slate-300">Rating {request.senderRating}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700" type="button" onClick={() => acceptRequest(request.id)}>
                      Accept
                    </button>
                    <button className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700" type="button" onClick={() => rejectRequest(request.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {outgoingRequests.length > 0 ? (
            <div className="mt-3 grid gap-2">
              <h3>Outgoing Requests</h3>
              {outgoingRequests.map((request) => (
                <div className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]" key={request.id}>
                  <div>
                    <div className="font-semibold text-slate-100">{request.receiverUsername}</div>
                    <div className="text-xs text-slate-300">Rating {request.receiverRating}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700" type="button" onClick={() => cancelRequest(request.id)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <ul className="mt-3 grid list-none gap-2 p-0">
            {friends.length === 0 ? (
              <li className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
                No friends yet. Send a request from the player list.
              </li>
            ) : null}
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3"
              >
                <span>{friend.username}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700 disabled:opacity-60"
                    type="button"
                    onClick={() => inviteFriend(friend.id)}
                    disabled={!friend.online}
                  >
                    {friend.online ? "Invite to Game" : "Offline"}
                  </button>
                  <button className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:border-emerald-300/70 hover:bg-slate-700" type="button" onClick={() => removeFriend(friend.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-dashed border-slate-600 pt-2 text-sm text-slate-300">
            {lastInviteLink
              ? `Latest invite link: ${lastInviteLink}`
              : "Create an invite from an online friend to start a match."}
          </div>
        </article>
      </section>
    </main>
  );
}
