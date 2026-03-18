import { WebSocketServer } from "ws";

import { host, port } from "./config.js";
import { createHttpServer } from "./http/createHttpServer.js";
import { RoomRegistry } from "./rooms/roomRegistry.js";
import { registerConnectionHandlers } from "./ws/registerConnectionHandlers.js";

const roomRegistry = new RoomRegistry();

const server = createHttpServer(() => ({
  rooms: roomRegistry.roomCount(),
  clients: wss.clients.size,
}));

const wss = new WebSocketServer({ server });

registerConnectionHandlers(wss, roomRegistry);

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] WS listening on ws://${host}:${port}`);
});
