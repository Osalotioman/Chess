export type InviteLookupResponse = {
  invite: {
    code: string;
    kind: "player" | "spectator";
    roomCode: string;
    status: string;
    active: boolean;
    seatsFull: boolean;
    expiresAt: string;
  };
};

export type InviteCreateResponse = {
  invite: {
    code: string;
    kind: "player" | "spectator";
    roomCode: string;
    expiresAt: string;
  };
};

export type InviteAcceptResponse = {
  invite: {
    code: string;
    kind: "player" | "spectator";
    roomCode: string;
    seat: "white" | "black" | "spectator";
  };
};
