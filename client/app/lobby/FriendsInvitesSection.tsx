import { Button } from "@components/ui/button";

import type { IncomingRequest, OutgoingRequest, Player } from "./types";

type FriendsInvitesSectionProps = {
  incomingRequests: IncomingRequest[];
  outgoingRequests: OutgoingRequest[];
  friends: Player[];
  lastInviteLink: string | null;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onCancelRequest: (requestId: string) => void;
  onInviteFriend: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
};

export function FriendsInvitesSection({
  incomingRequests,
  outgoingRequests,
  friends,
  lastInviteLink,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onInviteFriend,
  onRemoveFriend,
}: FriendsInvitesSectionProps) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
      <h2>Friends and Invites</h2>
      <p className="mt-1 text-sm text-slate-300">Manage live friend requests and invite friends to active games.</p>

      {incomingRequests.length > 0 ? (
        <div className="mt-3 grid gap-2">
          <h3>Incoming Requests</h3>
          {incomingRequests.map((request) => (
            <div
              className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]"
              key={request.id}
            >
              <div>
                <div className="font-semibold text-slate-100">{request.senderUsername}</div>
                <div className="text-xs text-slate-300">Rating {request.senderRating}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => onAcceptRequest(request.id)}>
                  Accept
                </Button>
                <Button variant="secondary" size="sm" type="button" onClick={() => onRejectRequest(request.id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {outgoingRequests.length > 0 ? (
        <div className="mt-3 grid gap-2">
          <h3>Outgoing Requests</h3>
          {outgoingRequests.map((request) => (
            <div
              className="grid items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 sm:grid-cols-[1fr_auto]"
              key={request.id}
            >
              <div>
                <div className="font-semibold text-slate-100">{request.receiverUsername}</div>
                <div className="text-xs text-slate-300">Rating {request.receiverRating}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => onCancelRequest(request.id)}>
                  Cancel
                </Button>
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
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => onInviteFriend(friend.id)}
                disabled={!friend.online}
              >
                {friend.online ? "Invite to Game" : "Offline"}
              </Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => onRemoveFriend(friend.id)}>
                Remove
              </Button>
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
  );
}
