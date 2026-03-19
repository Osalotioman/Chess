import assert from "node:assert/strict";
import test from "node:test";

import { RoomRegistry } from "../rooms/roomRegistry.js";
import { handleMoveMessage } from "./handleMoveMessage.js";

function createFakeSocket() {
  const messages: string[] = [];
  return {
    OPEN: 1,
    readyState: 1,
    send(payload: string) {
      messages.push(payload);
    },
    messages,
  };
}

test("handleMoveMessage records valid guest move and broadcasts to peer", async () => {
  const roomRegistry = new RoomRegistry();

  const whiteSocket = createFakeSocket();
  const blackSocket = createFakeSocket();

  roomRegistry.join(whiteSocket as never, "room-a", { mode: "guest", preferredSeat: "white" });
  roomRegistry.join(blackSocket as never, "room-a", { mode: "guest", preferredSeat: "black" });

  await handleMoveMessage(
    roomRegistry,
    whiteSocket as never,
    { mode: "guest" },
    { from: "e2", to: "e4" }
  );

  assert.equal(roomRegistry.getTurn("room-a"), "black");
  assert.equal(whiteSocket.messages.length, 1);
  assert.equal(blackSocket.messages.length, 1);
  assert.match(whiteSocket.messages[0] ?? "", /"type":"move"/);
  assert.match(blackSocket.messages[0] ?? "", /"type":"move"/);
});

test("handleMoveMessage rejects out-of-turn and spectator moves", async () => {
  const roomRegistry = new RoomRegistry();

  const whiteSocket = createFakeSocket();
  const blackSocket = createFakeSocket();
  const spectatorSocket = createFakeSocket();

  roomRegistry.join(whiteSocket as never, "room-b", { mode: "guest", preferredSeat: "white" });
  roomRegistry.join(blackSocket as never, "room-b", { mode: "guest", preferredSeat: "black" });
  roomRegistry.join(spectatorSocket as never, "room-b", { mode: "guest", preferredSeat: "spectator" });

  await handleMoveMessage(
    roomRegistry,
    whiteSocket as never,
    { mode: "guest" },
    { from: "e2", to: "e4" }
  );

  await handleMoveMessage(
    roomRegistry,
    whiteSocket as never,
    { mode: "guest" },
    { from: "e4", to: "e5" }
  );

  await handleMoveMessage(
    roomRegistry,
    spectatorSocket as never,
    { mode: "guest" },
    { from: "a2", to: "a3" }
  );

  const whiteErrors = whiteSocket.messages.filter((payload) => payload.includes('"type":"error"'));
  const spectatorErrors = spectatorSocket.messages.filter((payload) => payload.includes('"type":"error"'));

  assert.equal(whiteErrors.length >= 1, true);
  assert.equal(spectatorErrors.length >= 1, true);
});

test("handleMoveMessage rejects illegal guest move", async () => {
  const roomRegistry = new RoomRegistry();
  const whiteSocket = createFakeSocket();

  roomRegistry.join(whiteSocket as never, "room-c", { mode: "guest", preferredSeat: "white" });

  await handleMoveMessage(
    roomRegistry,
    whiteSocket as never,
    { mode: "guest" },
    { from: "e2", to: "e5" }
  );

  const errors = whiteSocket.messages.filter((payload) => payload.includes('"type":"error"'));
  assert.equal(errors.length >= 1, true);
  assert.equal(roomRegistry.getMoves("room-c").length, 0);
});
