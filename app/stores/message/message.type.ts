export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  type?: string;
  timestamp?: Date;
  room: string;
  metadata?: Record<string, any>;
  channelId?: string;
  author?: {
    id?: string;
    username: string;
    avatar?: string;
  };
}

export interface MessageState {
  messages: Record<string, Message[]>; // roomId -> messages[]
  loading: boolean;
  error: string | null;
}
