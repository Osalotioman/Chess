import { WebSocketServer, type VerifyClientCallbackSync } from "ws";

import { host, isOriginAllowed, port } from "./config";
import { createHttpServer } from "./http/createHttpServer";
import { RoomRegistry } from "./rooms/roomRegistry.js";
import { registerConnectionHandlers } from "./ws/registerConnectionHandlers.js";

const roomRegistry = new RoomRegistry();

const verifyClient: VerifyClientCallbackSync = (info) => isOriginAllowed(info.origin);

const server = createHttpServer(() => ({
  rooms: roomRegistry.roomCount(),
  clients: wss.clients.size,
}));

const wss = new WebSocketServer({
  server,
  verifyClient,
});

registerConnectionHandlers(wss, roomRegistry);

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] WS listening on ws://${host}:${port}`);
});
