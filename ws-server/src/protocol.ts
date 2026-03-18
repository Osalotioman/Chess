export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type JoinMessage = { type: "join"; room: string };

export type MoveMessage = {
  type: "move";
  from: string;
  to: string;
  promotion?: string;
};

export type ClientMessage = JoinMessage | MoveMessage;

export type ServerMessage =
  | { type: "joined"; room: string; peers: number }
  | { type: "peer_joined"; peers: number }
  | { type: "peer_left"; peers: number }
  | ({ type: "move" } & Omit<MoveMessage, "type">)
  | { type: "error"; message: string };

export type RoomId = string;
