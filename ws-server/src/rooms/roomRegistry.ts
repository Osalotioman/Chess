import type { WebSocket } from "ws";

import type { MoveSnapshot, PlayerIdentity, RoomId, Seat, TurnColor } from "../protocol.js";

type RoomState = {
  sockets: Set<WebSocket>;
  socketSeats: Map<WebSocket, Seat>;
  moves: MoveSnapshot[];
  turn: TurnColor;
};

export class RoomRegistry {
  private readonly rooms = new Map<RoomId, RoomState>();

  private readonly socketRoom = new WeakMap<WebSocket, RoomId>();

  private readonly socketPlayer = new WeakMap<WebSocket, PlayerIdentity>();

  private readonly socketSeat = new WeakMap<WebSocket, Seat>();

  public roomCount(): number {
    return this.rooms.size;
  }

  public getRoom(ws: WebSocket): RoomId | undefined {
    return this.socketRoom.get(ws);
  }

  public getPlayer(ws: WebSocket): PlayerIdentity {
    return this.socketPlayer.get(ws) ?? { mode: "guest" };
  }

  public getSeat(ws: WebSocket): Seat {
    return this.socketSeat.get(ws) ?? "spectator";
  }

  public getTurn(room: RoomId): TurnColor {
    return this.rooms.get(room)?.turn ?? "white";
  }

  public getMoves(room: RoomId): MoveSnapshot[] {
    return [...(this.rooms.get(room)?.moves ?? [])];
  }

  public countActivePlayerSockets(room: RoomId): number {
    const state = this.rooms.get(room);
    if (!state) return 0;

    let count = 0;
    for (const seat of state.socketSeats.values()) {
      if (seat === "white" || seat === "black") {
        count += 1;
      }
    }

    return count;
  }

  public recordMove(room: RoomId, move: MoveSnapshot, nextTurn?: TurnColor): void {
    const state = this.rooms.get(room);
    if (!state) return;

    state.moves.push(move);
    state.turn = nextTurn ?? (state.turn === "white" ? "black" : "white");
  }

  public join(
    ws: WebSocket,
    room: RoomId,
    player: PlayerIdentity
  ): {
    joined: boolean;
    peers: number;
    seat: Seat;
    turn: TurnColor;
    moves: MoveSnapshot[];
    left: { room: RoomId; peers: number } | null;
  } {
    const previousRoom = this.socketRoom.get(ws);
    if (previousRoom) {
      if (previousRoom === room) {
        this.socketPlayer.set(ws, player);
        const state = this.rooms.get(room);
        return {
          joined: false,
          peers: state?.sockets.size ?? 0,
          seat: this.getSeat(ws),
          turn: state?.turn ?? "white",
          moves: [...(state?.moves ?? [])],
          left: null,
        };
      }
      const left = this.leaveFromRoom(ws, previousRoom);

      const state = this.ensureRoom(room);
      state.sockets.add(ws);
      this.socketRoom.set(ws, room);
      this.socketPlayer.set(ws, player);
      const seat = this.assignSeat(state, ws, player.preferredSeat);

      return {
        joined: true,
        peers: state.sockets.size,
        seat,
        turn: state.turn,
        moves: [...state.moves],
        left,
      };
    }

    const state = this.ensureRoom(room);
    state.sockets.add(ws);
    this.socketRoom.set(ws, room);
    this.socketPlayer.set(ws, player);
    const seat = this.assignSeat(state, ws, player.preferredSeat);

    return {
      joined: true,
      peers: state.sockets.size,
      seat,
      turn: state.turn,
      moves: [...state.moves],
      left: null,
    };
  }

  public leave(ws: WebSocket): { room: RoomId; peers: number } | null {
    const room = this.socketRoom.get(ws);
    if (!room) return null;

    return this.leaveFromRoom(ws, room);
  }

  public listPeers(room: RoomId): Set<WebSocket> | undefined {
    return this.rooms.get(room)?.sockets;
  }

  private ensureRoom(room: RoomId): RoomState {
    const existing = this.rooms.get(room);
    if (existing) return existing;

    const created: RoomState = {
      sockets: new Set<WebSocket>(),
      socketSeats: new Map<WebSocket, Seat>(),
      moves: [],
      turn: "white",
    };
    this.rooms.set(room, created);
    return created;
  }

  private assignSeat(state: RoomState, ws: WebSocket, preferredSeat?: Seat): Seat {
    const current = state.socketSeats.get(ws);
    if (current) {
      this.socketSeat.set(ws, current);
      return current;
    }

    const seats = new Set(state.socketSeats.values());

    if (preferredSeat === "spectator") {
      state.socketSeats.set(ws, "spectator");
      this.socketSeat.set(ws, "spectator");
      return "spectator";
    }

    if (preferredSeat === "white" && !seats.has("white")) {
      state.socketSeats.set(ws, "white");
      this.socketSeat.set(ws, "white");
      return "white";
    }

    if (preferredSeat === "black" && !seats.has("black")) {
      state.socketSeats.set(ws, "black");
      this.socketSeat.set(ws, "black");
      return "black";
    }

    const seat: Seat = !seats.has("white") ? "white" : !seats.has("black") ? "black" : "spectator";
    state.socketSeats.set(ws, seat);
    this.socketSeat.set(ws, seat);
    return seat;
  }

  private leaveFromRoom(ws: WebSocket, room: RoomId): { room: RoomId; peers: number } {
    const state = this.rooms.get(room) ?? {
      sockets: new Set<WebSocket>(),
      socketSeats: new Map<WebSocket, Seat>(),
      moves: [],
      turn: "white" as TurnColor,
    };

    state.sockets.delete(ws);
    state.socketSeats.delete(ws);
    this.socketRoom.delete(ws);
    this.socketPlayer.delete(ws);
    this.socketSeat.delete(ws);

    if (state.sockets.size === 0) {
      this.rooms.delete(room);
      return { room, peers: 0 };
    }

    this.rooms.set(room, state);
    return { room, peers: state.sockets.size };
  }
}
