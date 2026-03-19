export type InviteLookupResponse = {
  invite: {
    code: string;
    roomCode: string;
    status: string;
    active: boolean;
    expiresAt: string;
  };
};

export type InviteCreateResponse = {
  invite: {
    code: string;
    roomCode: string;
    expiresAt: string;
  };
};

export type InviteAcceptResponse = {
  invite: {
    code: string;
    roomCode: string;
    seat: "white" | "black" | "spectator";
  };
};
