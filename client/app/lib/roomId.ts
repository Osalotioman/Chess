export function createRoomId(): string {
  // UUIDv7-style identifier: timestamp-prefixed, sortable, URL-safe.
  const nowHex = Date.now().toString(16).padStart(12, "0").slice(-12);
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);

  const hex = [...random].map((value) => value.toString(16).padStart(2, "0")).join("");

  return `${nowHex.slice(0, 8)}-${nowHex.slice(8, 12)}-7${hex.slice(0, 3)}-${hex.slice(3, 7)}-${hex.slice(7, 19)}`;
}
