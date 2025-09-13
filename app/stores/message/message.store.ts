import { defineStore } from "pinia";
import type { Message, MessageState } from "./message.type";
import { useWebSocketStore } from "../websocket/websocket.store";
import { joinRoom } from "../websocket/websocket.action";

export const useMessageStore = defineStore("message", {
  state: (): MessageState => ({
    messages: {},
    loading: false,
    error: null,
  }),

  getters: {
    getMessagesByRoom: (state) => (roomId: string) => {
      const messages = state.messages[roomId] || [];
      return messages;
    },

    getLatestMessage: (state) => (roomId: string) => {
      const messages = state.messages[roomId] || [];
      return messages[messages.length - 1] || null;
    },

    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    addMessage(channelId: string, message: Message) {
      if (!this.messages[channelId]) {
        this.messages[channelId] = [];
      }
      this.messages[channelId].push(message);
    },

    async sendMessage(channelId: string, content: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        // Ensure we're joined to the channel room before sending
        this.joinChannelRoom(channelId);

        // Call API to send message (server will handle Socket.IO emission)
        const response = await fetchWithAuth<Message>("/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId,
            content,
          }),
        });

        // API response should include the saved message
        if (response) {
          this.addMessage(channelId, response);
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to send message";
        console.error("Error sending message:", error);
        throw error; // Re-throw to let component handle it
      } finally {
        this.loading = false;
      }
    },

    receiveMessage(roomId: string, message: Message) {
      this.addMessage(roomId, message);
    },

    clearMessages(roomId: string) {
      if (this.messages[roomId]) {
        this.messages[roomId] = [];
      }
    },

    async fetchMessages(channelId: string) {
      const { fetchWithAuth } = useFetchWithAuth();
      try {
        this.loading = true;
        this.error = null;

        // Fetch messages for the room from API
        const messages = await fetchWithAuth<Message[]>(
          `/messages/${channelId}`
        );

        // Replace existing messages for this room
        this.messages[channelId] = messages.map((msg) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        }));
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch messages";
        console.error("Error fetching messages:", error);
      } finally {
        this.loading = false;
      }
    },

    // Join WebSocket room for the channel
    joinChannelRoom(channelId: string) {
      const roomName = `channel_${channelId}`;

      // Join the room using websocket action
      joinRoom(roomName);

      // The websocket store already listens for 'message' events
      // So we don't need to duplicate the listener here
    },
  },
});
