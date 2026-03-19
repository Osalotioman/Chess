export type Player = {
  id: string;
  username: string;
  rating: number;
  online: boolean;
  isFriend?: boolean;
};

export type PlayersResponse = {
  players: Array<{
    id: string;
    username: string;
    rating: number;
    online: boolean;
  }>;
};

export type FriendsResponse = {
  friends: Array<{
    id: string;
    username: string;
    rating: number;
    online: boolean;
  }>;
};

export type IncomingRequest = {
  id: string;
  senderId: string;
  senderUsername: string;
  senderRating: number;
  createdAt: string;
};

export type OutgoingRequest = {
  id: string;
  receiverId: string;
  receiverUsername: string;
  receiverRating: number;
  createdAt: string;
};

export type FriendRequestsResponse = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
};

export type InviteCreateResponse = {
  invite: {
    code: string;
    roomCode: string;
    expiresAt: string;
  };
};
