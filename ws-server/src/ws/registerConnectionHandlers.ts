import { type WebSocketServer } from "ws";

import { RoomRegistry } from "../rooms/roomRegistry.js";
import { broadcast } from "./socketMessaging.js";
import { handleIncomingMessage } from "./messageHandlers.js";

export function registerConnectionHandlers(wss: WebSocketServer, roomRegistry: RoomRegistry) {
  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] connected ${ip}`);

    ws.on("message", (data) => {
      // eslint-disable-next-line no-console
      console.log("Message:", data.toString("utf8"));
      const raw = typeof data === "string" ? data : data.toString("utf8");
      handleIncomingMessage(roomRegistry, ws, raw);
    });

    ws.on("close", () => {
      const left = roomRegistry.leave(ws);
      if (left && left.peers > 0) {
        broadcast(roomRegistry, left.room, ws, { type: "peer_left", peers: left.peers });
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
