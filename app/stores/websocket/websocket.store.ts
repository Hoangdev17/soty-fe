import { defineStore } from "pinia";
import { io } from "socket.io-client";
import type { WebSocketState, WebSocketMessage } from "./websocket.type";
import { useMessageStore } from "../message/message.store";
import type { Message } from "../message/message.type";

export const useWebSocketStore = defineStore("websocket", {
  state: (): WebSocketState => ({
    isConnected: false,
    connection: null,
    messages: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  }),

  getters: {
    getMessages: (state) => state.messages,
    isWebSocketConnected: (state) => state.isConnected,
  },

  actions: {
    connect(url: string, token?: string) {
      if (this.connection && this.isConnected) {
        return;
      }

      try {
        // Create Socket.IO connection with auth token
        const socketOptions: any = {
          transports: ["websocket", "polling"],
        };

        // Add token to query if provided
        if (token) {
          socketOptions.query = { token };
        }

        this.connection = io(url, socketOptions);

        this.connection.on("connect", () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.connection.on("disconnect", (reason: string) => {
          this.isConnected = false;
        });

        this.connection.on("connect_error", (error: Error) => {
          console.error("❌ Socket.IO connection error:", error.message);
          this.isConnected = false;
        });

        // Listen for custom message events
        this.connection.on("message", (data: Message) => {
          const messageStore = useMessageStore();
          const message: Message = {
            id: data.id,
            content: data.content,
            room: data.room,
            type: data.type,
            metadata: data.metadata,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            createdAt: new Date(data.createdAt),
            author: {
              id: data.author?.id,
              username: data.author?.username || "Unknown",
              avatar: data.author?.avatar,
            },
          };
          messageStore.receiveMessage(
            message.metadata?.channelId || "",
            message
          );

          // Also keep in websocket messages for debugging/logging
          const wsMessage: WebSocketMessage = {
            type: "message",
            payload: data,
            timestamp: Date.now(),
          };
          this.messages.push(wsMessage);
        });

        // Listen for other events from backend
        this.connection.on("notification", (data: any) => {
          const message: WebSocketMessage = {
            type: "notification",
            payload: data,
            timestamp: Date.now(),
          };
          this.messages.push(message);
        });
      } catch (error) {
        console.error("❌ Failed to create Socket.IO connection:", error);
      }
    },

    disconnect() {
      if (this.connection) {
        this.connection.disconnect();
        this.connection = null;
        this.isConnected = false;
      }
    },

    sendMessage(event: string, data: any) {
      if (this.connection && this.isConnected) {
        this.connection.emit(event, data);
      } else {
        console.warn("Socket.IO is not connected");
      }
    },

    // Specific methods for your backend events
    joinRoom(room: string) {
      this.sendMessage("join_room", { room });
    },

    leaveRoom(room: string) {
      this.sendMessage("leave", { room });
    },

    sendChatMessage(
      room: string,
      message: string,
      type: string = "text",
      metadata?: any
    ) {
      this.sendMessage("send_message", {
        room,
        message,
        type,
        metadata,
      });
    },

    clearMessages() {
      this.messages = [];
    },
  },
});
