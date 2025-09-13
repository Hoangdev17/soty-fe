import { useMessageStore } from "./message.store";
import type { Message } from "./message.type";

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
