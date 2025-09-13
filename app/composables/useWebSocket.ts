import { useWebSocketStore } from "../stores/websocket/websocket.store";
import {
  initializeSocketIO,
  disconnectSocketIO,
  connectToSocketIO,
  joinRoom,
  leaveRoom,
  sendChatMessage,
} from "../stores/websocket/websocket.action";

export const useWebSocket = () => {
  const wsStore = useWebSocketStore();

  const connect = (token?: string) => {
    connectToSocketIO(token);
  };

  const initialize = () => {
    initializeSocketIO();
  };

  const disconnect = () => {
    disconnectSocketIO();
  };

  const sendMessage = (event: string, data: any) => {
    wsStore.sendMessage(event, data);
  };

  const joinChatRoom = (room: string) => {
    joinRoom(room);
  };

  const leaveChatRoom = (room: string) => {
    leaveRoom(room);
  };

  const sendChatMsg = (
    room: string,
    message: string,
    type?: string,
    metadata?: any
  ) => {
    sendChatMessage(room, message, type, metadata);
  };

  const isConnected = computed(() => wsStore.isWebSocketConnected);
  const messages = computed(() => wsStore.getMessages);

  return {
    connect,
    initialize,
    disconnect,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    sendChatMsg,
    isConnected,
    messages,
  };
};
