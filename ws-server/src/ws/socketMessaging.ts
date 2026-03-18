import { type WebSocket } from "ws";

import type { RoomId, ServerMessage } from "../protocol.js";
import { RoomRegistry } from "../rooms/roomRegistry.js";

export function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

export function broadcast(
  roomRegistry: RoomRegistry,
  room: RoomId,
  except: WebSocket | null,
  msg: ServerMessage
) {
  const peers = roomRegistry.listPeers(room);
  if (!peers) return;

  const payload = JSON.stringify(msg);
  for (const peer of peers) {
    if (except && peer === except) continue;
    if (peer.readyState !== peer.OPEN) continue;
    peer.send(payload);
  }
}

export function broadcastRaw(
  roomRegistry: RoomRegistry,
  room: RoomId,
  except: WebSocket,
  raw: string
) {
  const peers = roomRegistry.listPeers(room);
  if (!peers) return;

  for (const peer of peers) {
    if (peer === except) continue;
    if (peer.readyState !== peer.OPEN) continue;
    peer.send(raw);
  }
}
