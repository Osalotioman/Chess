import type { WebSocket } from "ws";

import type { Seat } from "../protocol.js";

type SeatState = {
  socketSeats: Map<WebSocket, Seat>;
};

export function assignSeat(state: SeatState, ws: WebSocket, preferredSeat?: Seat): Seat {
  const current = state.socketSeats.get(ws);
  if (current) {
    return current;
  }

  const seats = new Set(state.socketSeats.values());

  if (preferredSeat === "spectator") {
    state.socketSeats.set(ws, "spectator");
    return "spectator";
  }

  if (preferredSeat === "white" && !seats.has("white")) {
    state.socketSeats.set(ws, "white");
    return "white";
  }

  if (preferredSeat === "black" && !seats.has("black")) {
    state.socketSeats.set(ws, "black");
    return "black";
  }

  const seat: Seat = !seats.has("white") ? "white" : !seats.has("black") ? "black" : "spectator";
  state.socketSeats.set(ws, seat);
  return seat;
}
