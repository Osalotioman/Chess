import { type WebSocketServer } from "ws";

import { apiServerOrigin, internalWsSharedSecret } from "../config.js";
import { RoomRegistry } from "../rooms/roomRegistry.js";
import { reportRoomPresence } from "../services/internalApi.js";
import { broadcast, send } from "./socketMessaging.js";
import { handleIncomingMessage } from "./messageHandlers.js";

const ROOM_ABANDON_TIMEOUT_MS = 30_000;

export function registerConnectionHandlers(wss: WebSocketServer, roomRegistry: RoomRegistry) {
  const roomAbandonTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function syncRoomPresence(room: string) {
    if (!internalWsSharedSecret) return;

    const activePlayerSockets = roomRegistry.countActivePlayerSockets(room);
    const existingTimer = roomAbandonTimers.get(room);

    if (activePlayerSockets > 0) {
      if (existingTimer) {
        clearTimeout(existingTimer);
        roomAbandonTimers.delete(room);
      }

      void reportRoomPresence(apiServerOrigin, internalWsSharedSecret, room, activePlayerSockets);
      return;
    }

    if (existingTimer) return;

    const timer = setTimeout(() => {
      roomAbandonTimers.delete(room);
      void reportRoomPresence(apiServerOrigin, internalWsSharedSecret, room, 0);
    }, ROOM_ABANDON_TIMEOUT_MS);

    roomAbandonTimers.set(room, timer);
  }

  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] connected ${ip}`);

    ws.on("message", (data) => {
      // eslint-disable-next-line no-console
      console.log("Message:", data.toString("utf8"));
      const raw = typeof data === "string" ? data : data.toString("utf8");
      void handleIncomingMessage(roomRegistry, ws, raw, (room) => syncRoomPresence(room)).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn("message handling failed", error);
        send(ws, {
          type: "error",
          message: "Internal message handling failure",
        });
      });
    });

    ws.on("close", () => {
      const left = roomRegistry.leave(ws);
      if (left && left.peers > 0) {
        broadcast(roomRegistry, left.room, ws, { type: "peer_left", peers: left.peers });
      }

      if (left) {
        syncRoomPresence(left.room);
      }

      // eslint-disable-next-line no-console
      console.log(`[${new Date().toISOString()}] disconnected ${ip}`);
    });

    ws.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.warn(`[${new Date().toISOString()}] ws error`, err);
    });
  });
}
