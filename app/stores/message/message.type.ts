import type { ChannelType } from "../channels/channel.type";

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  type?: string | number; // Backend returns numeric type (0 = text, 19 = reply)
  timestamp?: Date;
  room: string;
  metadata?: Record<string, any>;
  channelId?: string;
  channelName?: string;
  author?: {
    id?: string;
    username: string;
    avatar?: string;
  };
  // Reply functionality - matches backend response
  replyTo?: {
    id: string;
    content: string;
    author: {
      id?: string;
      username: string;
      avatar?: string;
    };
  };
  // Pin functionality
  pinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: {
    id?: string;
    username: string;
    avatar?: string;
  };
  // Thread functionality
  threadId?: string;
  isThreadStarter?: boolean;
  threadCount?: number;
}

export interface Thread {
  id: string;
  channelId: string;
  starterMessageId: string;
  name: string;
  topic: string;
  type: ChannelType;
  createdAt: Date;
  createdBy: {
    id?: string;
    username: string;
    avatar?: string;
  };
  lastMessageAt?: Date;
  messageCount: number;
  members: string[]; // user IDs
}

export interface MessageState {
  messages: Record<string, Message[]>; // roomId -> messages[]
  threads: Thread[]; // array of threads
  currentThread: Thread | null;
  pinnedMessages: Record<string, Message[]>; // channelId -> pinned messages[]
  loading: boolean;
  error: string | null;
}

export interface PinMessageResponse {
  channelId: string;
  formatted: Message;
}
