import { useMessageStore } from "../stores/message/message.store";
import {
  sendMessageToRoom,
  addReceivedMessage,
  fetchMessagesForRoom,
} from "../stores/message/message.action";
import { useWebSocket } from "./useWebSocket";
import type { Message } from "../stores/message/message.type";

export const useMessage = () => {
  const messageStore = useMessageStore();
  const {
    messages: socketMessages,
    joinChatRoom,
    leaveChatRoom,
  } = useWebSocket();

  // Sync Socket.IO messages to message store
  watch(socketMessages, (newMessages) => {
    newMessages.forEach((socketMsg) => {
      // Fix: Backend sends direct message data, not wrapped in payload
      if (
        socketMsg.type === "text" ||
        (socketMsg.type === "message" && socketMsg.payload)
      ) {
        // Handle direct message data (type: 'text') OR wrapped payload
        const msgData = socketMsg.payload || socketMsg;

        const message: Message = {
          id: msgData.id || `msg_${Date.now()}`,
          content: msgData.message || "",
          type: msgData.type || "text",
          timestamp: msgData.timestamp
            ? new Date(msgData.timestamp)
            : new Date(),
          room: msgData.room || "",
          metadata: msgData.metadata,
          createdAt: msgData.createdAt,
          author: msgData.user || {
            id: msgData.userId,
            username: msgData.username || "Unknown",
            avatar: msgData.metadata?.author?.avatar,
          },
        };

        const channelId = message.room.replace("channel_", "");
        addReceivedMessage(channelId, message);
      }
    });
  });

  const joinRoom = (roomId: string) => {
    const roomName = `channel_${roomId}`;
    joinChatRoom(roomName);
  };

  const leaveRoom = (roomId: string) => {
    const roomName = `channel_${roomId}`;
    leaveChatRoom(roomName);
  };

  const fetchMessages = (roomId: string) => {
    return fetchMessagesForRoom(roomId);
  };

  const sendMessage = (channelId: string, message: string) => {
    return sendMessageToRoom(channelId, message);
  };

  const getMessages = (roomId: string) => {
    return messageStore.getMessagesByRoom(roomId);
  };

  const clearMessages = (roomId: string) => {
    messageStore.clearMessages(roomId);
  };

  const isLoading = computed(() => messageStore.isLoading);
  const error = computed(() => messageStore.getError);

  return {
    joinRoom,
    leaveRoom,
    fetchMessages,
    sendMessage,
    getMessages,
    clearMessages,
    isLoading,
    error,
  };
};
