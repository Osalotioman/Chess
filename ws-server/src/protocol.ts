export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type PlayerIdentity = {
  mode: "guest" | "account";
  guestId?: string;
  guestName?: string;
  userId?: string;
  username?: string;
};

export type JoinMessage = { type: "join"; room: string; player?: PlayerIdentity };

export type MoveMessage = {
  type: "move";
  from: string;
  to: string;
  promotion?: string;
};

export type ClientMessage = JoinMessage | MoveMessage;

export type ServerMessage =
  | { type: "joined"; room: string; peers: number; player: PlayerIdentity }
  | { type: "peer_joined"; peers: number; player: PlayerIdentity }
  | { type: "peer_left"; peers: number }
  | ({ type: "move" } & Omit<MoveMessage, "type">)
  | { type: "error"; message: string };

export type RoomId = string;
