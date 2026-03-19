import type { WebSocket } from "ws";

import type { PlayerIdentity, RoomId } from "../protocol.js";

export class RoomRegistry {
  private readonly rooms = new Map<RoomId, Set<WebSocket>>();

  private readonly socketRoom = new WeakMap<WebSocket, RoomId>();

  private readonly socketPlayer = new WeakMap<WebSocket, PlayerIdentity>();

  public roomCount(): number {
    return this.rooms.size;
  }

  public getRoom(ws: WebSocket): RoomId | undefined {
    return this.socketRoom.get(ws);
  }

  public getPlayer(ws: WebSocket): PlayerIdentity {
    return this.socketPlayer.get(ws) ?? { mode: "guest" };
  }

  public join(
    ws: WebSocket,
    room: RoomId,
    player: PlayerIdentity
  ): { joined: boolean; peers: number; left: { room: RoomId; peers: number } | null } {
    const previousRoom = this.socketRoom.get(ws);
    if (previousRoom) {
      if (previousRoom === room) {
        this.socketPlayer.set(ws, player);
        return { joined: false, peers: this.rooms.get(room)?.size ?? 0, left: null };
      }
      const left = this.leaveFromRoom(ws, previousRoom);

      const peers = this.rooms.get(room) ?? new Set<WebSocket>();
      peers.add(ws);
      this.rooms.set(room, peers);
      this.socketRoom.set(ws, room);
      this.socketPlayer.set(ws, player);

      return { joined: true, peers: peers.size, left };
    }

    const peers = this.rooms.get(room) ?? new Set<WebSocket>();
    peers.add(ws);
    this.rooms.set(room, peers);
    this.socketRoom.set(ws, room);
    this.socketPlayer.set(ws, player);

    return { joined: true, peers: peers.size, left: null };
  }

  public leave(ws: WebSocket): { room: RoomId; peers: number } | null {
    const room = this.socketRoom.get(ws);
    if (!room) return null;

    return this.leaveFromRoom(ws, room);
  }

  public listPeers(room: RoomId): Set<WebSocket> | undefined {
    return this.rooms.get(room);
  }

  private leaveFromRoom(ws: WebSocket, room: RoomId): { room: RoomId; peers: number } {
    const peers = this.rooms.get(room) ?? new Set<WebSocket>();
    peers.delete(ws);
    this.socketRoom.delete(ws);
    this.socketPlayer.delete(ws);

    if (peers.size === 0) {
      this.rooms.delete(room);
      return { room, peers: 0 };
    }

    this.rooms.set(room, peers);
    return { room, peers: peers.size };
  }
}
