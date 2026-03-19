import assert from "node:assert/strict";
import test from "node:test";

import {
  isRecord,
  isValidRoom,
  normalizeMoveField,
  normalizePlayerIdentity,
  safeJsonParse,
} from "./messageValidation.js";

test("safeJsonParse parses valid JSON and rejects invalid payload", () => {
  assert.deepEqual(safeJsonParse('{"type":"join","room":"abc"}'), {
    type: "join",
    room: "abc",
  });
  assert.equal(safeJsonParse("not-json"), undefined);
});

test("room and move validators normalize and enforce bounds", () => {
  assert.equal(isValidRoom("room-123"), true);
  assert.equal(isValidRoom("??"), false);

  assert.equal(normalizeMoveField(" e2 "), "e2");
  assert.equal(normalizeMoveField(""), null);
  assert.equal(normalizeMoveField(42), null);
});

test("normalizePlayerIdentity returns guest default and trims account identity", () => {
  assert.deepEqual(normalizePlayerIdentity(null), { mode: "guest" });

  const normalized = normalizePlayerIdentity({
    mode: "account",
    userId: "  user-1  ",
    username: "  player  ",
    preferredSeat: "black",
  });

  assert.deepEqual(normalized, {
    mode: "account",
    userId: "user-1",
    username: "player",
    preferredSeat: "black",
    guestId: undefined,
    guestName: undefined,
  });

  assert.equal(isRecord(normalized), true);
});
