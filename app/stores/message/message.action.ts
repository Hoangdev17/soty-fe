import type { ChannelType } from "../channels/channel.type";
import { useMessageStore } from "./message.store";
import type { Message, Thread } from "./message.type";

export const sendMessageToRoom = (channelId: string, message: string) => {
  const messageStore = useMessageStore();
  return messageStore.sendMessage(channelId, message);
};

export const addReceivedMessage = (channelId: string, message: Message) => {
  const messageStore = useMessageStore();
  messageStore.receiveMessage(channelId, message);
};

export const getMessagesForRoom = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.getMessagesByRoom(channelId);
};

export const fetchMessagesForRoom = (
  roomId: string,
  limit = 50,
  offset = 0
) => {
  const messageStore = useMessageStore();
  return messageStore.fetchMessages(roomId, limit, offset);
};

// Reply functionality
export const replyToMessage = (
  channelId: string,
  content: string,
  replyToMessageId: string,
  mentionAuthor: boolean = true
) => {
  const messageStore = useMessageStore();
  return messageStore.replyToMessage(
    channelId,
    content,
    replyToMessageId,
    mentionAuthor
  );
};

// Pin functionality
export const pinMessage = (messageId: string, channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.pinMessage(messageId, channelId);
};

export const unpinMessage = (messageId: string, channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.unpinMessage(messageId, channelId);
};

export const getPinnedMessages = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.getPinnedMessages(channelId);
};

export const fetchPinnedMessages = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.fetchPinnedMessages(channelId);
};

// Thread functionality
export const createThread = (
  channelId: string,
  starterMessageId: string,
  name: string,
  topic: string,
  type: ChannelType
) => {
  const messageStore = useMessageStore();
  return messageStore.createThread(
    channelId,
    starterMessageId,
    name,
    topic,
    type
  );
};

export const getThread = (threadId: string) => {
  const messageStore = useMessageStore();
  return messageStore.getThread(threadId);
};

export const getThreadsByChannel = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.getThreadsByChannel(channelId);
};

export const fetchThread = (threadId: string, channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.fetchThread(threadId, channelId);
};

export const fetchThreadsByChannel = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.fetchThreadsByChannel(channelId);
};

export const sendMessageToThread = (threadId: string, content: string) => {
  const messageStore = useMessageStore();
  return messageStore.sendMessageToThread(threadId, content);
};

// Message references functionality
export const fetchMessageReferences = (channelId: string) => {
  const messageStore = useMessageStore();
  return messageStore.fetchMessageReferences(channelId);
};
