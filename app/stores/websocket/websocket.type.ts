import type { Socket } from "socket.io-client";
import type { Member } from "../member/member.type";

export type WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect";
  DISCONNECT: "disconnect";

  // Room management events
  JOIN_ROOM: "join_room";
  LEAVE_ROOM: "leave_room";
  JOINED_ROOM: "joined_room";
  LEFT_ROOM: "left_room";

  // Messaging events
  SEND_MESSAGE: "send_message";
  MESSAGE: "message";

  // User events
  USER_ONLINE: "user_online";
  USER_OFFLINE: "user_offline";

  // Community events
  COMMUNITY_UPDATE: "community_update";
  MEMBER_JOINED: "member_joined";
  MEMBER_LEFT: "member_left";
  ROLE_UPDATED: "role_updated";
  GET_MEMBERS: "get_members";
  MEMBERS_LIST: "members_list";

  // Notification events
  NOTIFICATION: "notification";

  // Error events
  ERROR: "error";
};

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  connection: Socket | null;
  messages: WebSocketMessage[];
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface GetMembersPayload {
  communityId: string;
}

export interface MembersListData {
  members: Member[]; // You can define a proper Member type here
}

export interface MembersListPayload {
  members: Member[];
  requestedBy: string;
  timestamp: Date;
}

export interface WebSocketResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

export interface JoinedCommunityPayload {
  communityId: string;
  members: Member;
  joinedBy: string;
  timestamp: Date;
}
