// Socket.IO actions - utility functions for Socket.IO operations
import { useWebSocketStore } from "./websocket.store";

export const connectToSocketIO = (token?: string) => {
  const config = useRuntimeConfig();
  const baseUrl: string = config.public.apiBase || "http://localhost:3000";

  // Chỉ gọi store trong composable/setup
  const wsStore = useWebSocketStore();
  wsStore.connect(baseUrl, token);
};

export const initializeSocketIO = () => {
  // Get auth token from localStorage if available
  const token = localStorage.getItem("accessToken") || undefined;

  // Tự động kết nối khi vào community
  connectToSocketIO(token);
};

export const disconnectSocketIO = () => {
  const wsStore = useWebSocketStore();
  wsStore.disconnect();
};

export const joinRoom = (room: string) => {
  const wsStore = useWebSocketStore();
  wsStore.joinRoom(room);
};

export const leaveRoom = (room: string) => {
  const wsStore = useWebSocketStore();
  wsStore.leaveRoom(room);
};

export const ensureRoomJoined = (room: string, maxRetries: number = 3) => {
  const wsStore = useWebSocketStore();
  // Call store action that will retry joining until connected or retries exhausted
  wsStore.ensureRoomJoined(room, maxRetries);
};

export const sendChatMessage = (
  room: string,
  message: string,
  type: string = "text",
  metadata?: any
) => {
  const wsStore = useWebSocketStore();
  wsStore.sendChatMessage(room, message, type, metadata);
};

// Legacy compatibility
export const connectToWebSocket = connectToSocketIO;
export const initializeWebSocket = initializeSocketIO;
export const disconnectWebSocket = disconnectSocketIO;
