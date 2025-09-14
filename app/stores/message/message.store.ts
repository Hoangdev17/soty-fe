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
        const socketStore = useWebSocketStore();
        const messageStore = useMessageStore();
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const res = await fetchWithAuth<Message>(`/messages`, {
          method: "POST",
          body: JSON.stringify({ channelId, content }),
        });

        messageStore.addMessage(channelId, res);

        socketStore.sendChatMessage(`channel_${channelId}`, content);
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

    clearAllMessages() {
      this.messages = {};
      this.loading = false;
      this.error = null;
    },

    async fetchMessages(channelId: string, limit = 50, offset = 0) {
      const { fetchWithAuth } = useFetchWithAuth();
      try {
        this.loading = true;
        this.error = null;

        // Fetch messages for the room from API with pagination
        const messages = await fetchWithAuth<Message[]>(
          `/messages/${channelId}?limit=${limit}&offset=${offset}`
        );

        // If offset > 0, append to existing messages, else replace
        if (offset > 0) {
          if (!this.messages[channelId]) {
            this.messages[channelId] = [];
          }
          // Prepend older messages (since offset increases for older messages)
          this.messages[channelId] = [
            ...messages.map((msg) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            })),
            ...this.messages[channelId],
          ];
        } else {
          // Replace existing messages for this room
          this.messages[channelId] = messages.map((msg) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }));
        }
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
