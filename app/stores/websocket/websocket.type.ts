import type { Socket } from "socket.io-client";
import type { Member } from "../member/member.type";
import type { ChannelType } from "../channels/channel.type";
import type { User } from "../auth/auth.type";

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
  MESSAGE_DELETED: "message_deleted";

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

  //CHANNEL
  CREATE_CHANNEL: "create_channel";

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
  // Unread messages state
  unreadByChannel: Record<string, Set<string>>;
  isUnreadStateRestored: boolean;
  joinedRooms: Set<string>;
  // messageId -> timestamp (ms) để hỗ trợ partial clear theo lastRead timestamp
  messageTimestamps: Record<string, number>;
  // channelId -> communityId (nếu channel thuộc community)
  channelToCommunity: Record<string, string | undefined>;
  // Cache để tránh fetch unread quá nhiều lần
  unreadCacheByChannel: Record<string, { count: number; lastFetched: number }>;
  unreadCacheByCommunity: Record<
    string,
    { count: number; lastFetched: number }
  >;
  // Flag để chỉ init unread 1 lần
  isUnreadInitialized: boolean;
  // Track toast shown for messages to prevent duplicates
  toastShownForMessages: Set<string>;
  // Voice channel users
  usersInRoom: string[];
  usersInfo: Record<
    string,
    {
      avatar?: string;
      name?: string;
      username?: string;
      isVideoEnabled: boolean;
      isAudioEnabled: boolean;
    }
  >;
  // map from userId (app-level id) -> socketId when available
  userIdToSocketId?: Record<string, string>;
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

export interface CreateChannelPayload {
  guildId: string;
  name: string;
  nsfw: boolean;
  topic?: string;
  position?: number;
  type: ChannelType;
  manageable: boolean;
  rateLimitPerUser?: number;
  parentId?: string;
  viewAble?: boolean;
  recipients?: string[];
  maxMembers?: number;
}

export interface ChannelCreatedData {
  channel: {
    id: string;
    name: string;
    description: string;
    lastMessageId: string | null;
    manageable: boolean;
    starterMessageId: string | null;
    nsfw: boolean;
    parentId: string | null;
    position: number;
    isPrivate: boolean;
    topic: string | null;
    type: ChannelType;
    viewAble: boolean;
    rateLimitPerUser: number | null;
    recipients?: User[];
    maxMembers: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  communityId: string;
  createdBy: string;
  timestamp: Date;
}
