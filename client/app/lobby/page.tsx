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
    <main className="page-shell lobby-shell">
      <header className="topbar shell-card">
        <h1>Player Lobby</h1>
        <p>Find players, build your friends list, and invite someone to a match.</p>
      </header>

      <section className="panel shell-card lobby-toolbar">
        <input
          aria-label="Search players"
          placeholder="Search by player name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Link href="/arena" className="btn btn-primary">
          Go to Arena
        </Link>
      </section>

      {isLoading ? <div className="lobby-note">Loading player directory...</div> : null}
      {loadError ? <div className="lobby-note">{loadError}</div> : null}

      <section className="lobby-grid">
        <article className="panel shell-card">
          <h2>Players on Platform</h2>
          <p className="lobby-sub">Browse real player accounts and add friends directly.</p>
          <div className="player-list">
            {filtered.length === 0 ? <div className="lobby-note">No players found.</div> : null}
            {filtered.map((player) => {
              const pending = pendingRequests.includes(player.id);
              return (
                <div className="player-row" key={player.id}>
                  <div>
                    <div className="player-name">{player.username}</div>
                    <div className="player-meta">
                      Rating {player.rating} | {player.online ? "Online" : "Offline"}
                    </div>
                  </div>
                  <div className="player-actions">
                    {player.isFriend ? <span className="pill ok">Friend</span> : null}
                    {!player.isFriend ? (
                      <button
                        type="button"
                        className="control-btn"
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

        <article className="panel shell-card">
          <h2>Friends and Invites</h2>
          <p className="lobby-sub">Manage live friend requests and invite friends to active games.</p>

          {incomingRequests.length > 0 ? (
            <div className="player-list">
              <h3>Incoming Requests</h3>
              {incomingRequests.map((request) => (
                <div className="player-row" key={request.id}>
                  <div>
                    <div className="player-name">{request.senderUsername}</div>
                    <div className="player-meta">Rating {request.senderRating}</div>
                  </div>
                  <div className="player-actions">
                    <button className="control-btn" type="button" onClick={() => acceptRequest(request.id)}>
                      Accept
                    </button>
                    <button className="control-btn" type="button" onClick={() => rejectRequest(request.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {outgoingRequests.length > 0 ? (
            <div className="player-list">
              <h3>Outgoing Requests</h3>
              {outgoingRequests.map((request) => (
                <div className="player-row" key={request.id}>
                  <div>
                    <div className="player-name">{request.receiverUsername}</div>
                    <div className="player-meta">Rating {request.receiverRating}</div>
                  </div>
                  <div className="player-actions">
                    <button className="control-btn" type="button" onClick={() => cancelRequest(request.id)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <ul className="friend-list">
            {friends.length === 0 ? <li>No friends yet. Send a request from the player list.</li> : null}
            {friends.map((friend) => (
              <li key={friend.id}>
                <span>{friend.username}</span>
                <div className="player-actions">
                  <button
                    className="control-btn"
                    type="button"
                    onClick={() => inviteFriend(friend.id)}
                    disabled={!friend.online}
                  >
                    {friend.online ? "Invite to Game" : "Offline"}
                  </button>
                  <button className="control-btn" type="button" onClick={() => removeFriend(friend.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="lobby-note">
            {lastInviteLink
              ? `Latest invite link: ${lastInviteLink}`
              : "Create an invite from an online friend to start a match."}
          </div>
        </article>
      </section>
    </main>
  );
}
