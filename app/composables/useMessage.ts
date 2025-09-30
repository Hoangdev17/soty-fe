import { useMessageStore } from "../stores/message/message.store";
import {
  sendMessageToRoom,
  addReceivedMessage,
  fetchMessagesForRoom,
  replyToMessage as replyToMessageAction,
  pinMessage as pinMessageAction,
  unpinMessage as unpinMessageAction,
  fetchPinnedMessages as fetchPinnedMessagesAction,
  createThread as createThreadAction,
  fetchThread as fetchThreadAction,
  fetchThreadsByChannel as fetchThreadsByChannelAction,
  sendMessageToThread as sendMessageToThreadAction,
  fetchMessageReferences as fetchMessageReferencesAction,
} from "../stores/message/message.action";
import { useWebSocket } from "./useWebSocket";
import type { Message } from "../stores/message/message.type";
import type { ChannelType } from "~/stores/channels/channel.type";

export const useMessage = () => {
  const messageStore = useMessageStore();
  const {
    messages: socketMessages,
    joinChatRoom,
    leaveChatRoom,
  } = useWebSocket();

  // Sync Socket.IO messages to message store
  // Disabled to prevent duplicate processing - WebSocket store already handles this
  // watch(socketMessages, (newMessages) => {
  //   newMessages.forEach((socketMsg) => {
  //     // Fix: Backend sends direct message data, not wrapped in payload
  //     if (
  //       socketMsg.type === "text" ||
  //       (socketMsg.type === "message" && socketMsg.payload)
  //     ) {
  //       // Handle direct message data (type: 'text') OR wrapped payload
  //       const msgData = socketMsg.payload || socketMsg;

  //       const message: Message = {
  //         id: msgData.id || `msg_${Date.now()}`,
  //         content: msgData.content || msgData.message || "",
  //         type: msgData.type || "text",
  //         timestamp: msgData.timestamp
  //           ? new Date(msgData.timestamp)
  //           : new Date(),
  //         room: msgData.room || "",
  //         metadata: msgData.metadata,
  //         createdAt: msgData.createdAt,
  //         author: msgData.user || {
  //           id: msgData.userId,
  //           username: msgData.username || "Unknown",
  //           avatar: msgData.metadata?.author?.avatar,
  //         },
  //       };

  //       const channelId = message.room.replace("channel_", "");
  //       addReceivedMessage(channelId, message);
  //     }
  //   });
  // });

  const joinRoom = (roomId: string) => {
    const roomName = `channel_${roomId}`;
    joinChatRoom(roomName);
  };

  const joinThreadRoom = (threadId: string) => {
    const roomName = `thread_${threadId}`;
    joinChatRoom(roomName);
  };

  const leaveRoom = (roomId: string) => {
    const roomName = `channel_${roomId}`;
    leaveChatRoom(roomName);
  };

  const leaveThreadRoom = (threadId: string) => {
    const roomName = `thread_${threadId}`;
    leaveChatRoom(roomName);
  };

  const fetchMessages = (roomId: string, limit = 50, offset = 0) => {
    return fetchMessagesForRoom(roomId, limit, offset);
  };

  const sendMessage = (
    channelId: string,
    message: string,
    type: string = "text"
  ) => {
    return sendMessageToRoom(channelId, message, type);
  };

  const getMessages = (roomId: string) => {
    return messageStore.getMessagesByRoom(roomId);
  };

  const clearMessages = (roomId: string) => {
    messageStore.clearMessages(roomId);
  };

  const isLoading = computed(() => messageStore.isLoading);
  const error = computed(() => messageStore.getError);

  // Reply functionality
  const replyToMessage = (
    channelId: string,
    content: string,
    replyToMessageId: string,
    mentionAuthor: boolean = true
  ) => {
    return replyToMessageAction(
      channelId,
      content,
      replyToMessageId,
      mentionAuthor
    );
  };

  // Pin functionality
  const pinMessage = (messageId: string, channelId: string) => {
    return pinMessageAction(messageId, channelId);
  };

  const unpinMessage = (messageId: string, channelId: string) => {
    return unpinMessageAction(messageId, channelId);
  };

  const getPinnedMessages = (channelId: string) => {
    return messageStore.getPinnedMessages(channelId);
  };

  const fetchPinnedMessages = (channelId: string) => {
    return fetchPinnedMessagesAction(channelId);
  };

  // Thread functionality
  const createThread = (
    channelId: string,
    starterMessageId: string,
    name: string,
    topic: string,
    type: ChannelType
  ) => {
    return createThreadAction(channelId, starterMessageId, name, topic, type);
  };

  const getThread = (threadId: string) => {
    return messageStore.getThread(threadId);
  };

  const getThreadsByChannel = (channelId: string) => {
    return messageStore.getThreadsByChannel(channelId);
  };

  const fetchThread = (threadId: string, channelId: string) => {
    return fetchThreadAction(threadId, channelId);
  };

  const fetchThreadsByChannel = (channelId: string) => {
    return fetchThreadsByChannelAction(channelId);
  };

  const sendMessageToThread = (
    threadId: string,
    content: string,
    type: string = "text"
  ) => {
    return sendMessageToThreadAction(threadId, content, type);
  };

  const fetchMessageReferences = (channelId: string) => {
    return fetchMessageReferencesAction(channelId);
  };

  return {
    joinRoom,
    joinThreadRoom,
    leaveRoom,
    leaveThreadRoom,
    fetchMessages,
    sendMessage,
    getMessages,
    clearMessages,
    isLoading,
    error,
    // Reply functionality
    replyToMessage,
    fetchMessageReferences,
    // Pin functionality
    pinMessage,
    unpinMessage,
    getPinnedMessages,
    fetchPinnedMessages,
    // Thread functionality
    createThread,
    getThread,
    getThreadsByChannel,
    fetchThread,
    fetchThreadsByChannel,
    sendMessageToThread,
  };
};
