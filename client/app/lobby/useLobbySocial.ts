import { useEffect, useMemo, useState } from "react";

import { apiDelete, apiGet, apiPost } from "../lib/api";
import { getAccessToken, getStoredSession } from "../lib/session";
import type {
  FriendRequestsResponse,
  FriendsResponse,
  IncomingRequest,
  InviteCreateResponse,
  OutgoingRequest,
  Player,
  PlayersResponse,
} from "./types";

export function useLobbySocial() {
  const currentUserId = getStoredSession()?.user.id ?? null;
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
          response.players
            .filter((player) => player.id !== currentUserId)
            .map((player) => ({
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
  }, [query, friends, currentUserId]);

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

  const filteredPlayers = useMemo(() => {
    const friendIds = new Set(friends.map((friend) => friend.id));
    return players.map((player) => ({ ...player, isFriend: friendIds.has(player.id) }));
  }, [players, friends]);

  async function requestFriend(playerId: string) {
    if (pendingRequests.includes(playerId)) return;
    if (playerId === currentUserId) {
      setLoadError("You cannot add yourself as a friend.");
      return;
    }

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

  return {
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
  };
}
