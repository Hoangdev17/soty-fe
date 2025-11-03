import { defineStore } from "pinia";
import type { Message, MessageState, Thread } from "./message.type";
import { useWebSocketStore } from "../websocket/websocket.store";
import { joinRoom } from "../websocket/websocket.action";
import type { ChannelType } from "../channels/channel.type";

export const useMessageStore = defineStore("message", {
  state: (): MessageState => ({
    messages: {},
    threads: [],
    currentThread: null,
    pinnedMessages: {},
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

    getPinnedMessages: (state) => (channelId: string) => {
      return state.pinnedMessages[channelId] || [];
    },

    getThread: (state) => (threadId: string) => {
      return state.threads.find((thread) => thread.id === threadId) || null;
    },

    getThreadsByChannel: (state) => (channelId: string) => {
      return state.threads.filter((thread) => thread.channelId === channelId);
    },

    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    addMessage(channelId: string, message: Message) {
      if (!this.messages[channelId]) {
        this.messages[channelId] = [];
      }

      // Check if message already exists to prevent duplicates
      const existingMessageIndex = this.messages[channelId].findIndex(
        (msg) => msg.id === message.id
      );

      if (existingMessageIndex === -1) {
        this.messages[channelId].push(message);
      } else {
        // Update existing message if needed
        this.messages[channelId][existingMessageIndex] = message;
      }
    },

    async sendMessage(
      channelId: string,
      content: string,
      type: string = "text"
    ) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const res = await fetchWithAuth<Message>(`/messages`, {
          method: "POST",
          body: JSON.stringify({ channelId, content, type }),
        });

        // Message will be added via websocket when broadcast
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to send message";
        throw error;
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

    async fetchMessages(roomId: string, limit = 50, offset = 0) {
      const { fetchWithAuth } = useFetchWithAuth();
      try {
        this.loading = true;
        this.error = null;

        let endpoint: string;
        // Use endpoint that matches backend getMessages method
        endpoint = `/messages/${roomId}?limit=${limit}&offset=${offset}`;

        // Fetch messages for the room from API with pagination
        const messages = await fetchWithAuth<Message[]>(endpoint);

        // If offset > 0, append to existing messages, else replace
        if (offset > 0) {
          if (!this.messages[roomId]) {
            this.messages[roomId] = [];
          }
          // Prepend older messages (since offset increases for older messages)
          this.messages[roomId] = [
            ...messages.map((msg) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
              room: `channel_${roomId}`, // Add room field for frontend compatibility
              // Ensure replyTo data is properly mapped
              replyTo: msg.replyTo
                ? {
                    id: msg.replyTo.id,
                    content: msg.replyTo.content,
                    author: {
                      id: msg.replyTo.author?.id,
                      username: msg.replyTo.author?.username || "Unknown",
                      avatar: msg.replyTo.author?.avatar,
                    },
                  }
                : undefined,
            })),
            ...this.messages[roomId],
          ];
        } else {
          // Replace existing messages for this room
          this.messages[roomId] = messages.map((msg) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
            room: `channel_${roomId}`, // Add room field for frontend compatibility
            // Ensure replyTo data is properly mapped
            replyTo: msg.replyTo
              ? {
                  id: msg.replyTo.id,
                  content: msg.replyTo.content,
                  author: {
                    id: msg.replyTo.author?.id,
                    username: msg.replyTo.author?.username || "Unknown",
                    avatar: msg.replyTo.author?.avatar,
                  },
                }
              : undefined,
          }));
        }

        // Fetch pinned messages and update pinned flags
        if (offset === 0) {
          // Only fetch pinned on initial load
          try {
            await this.fetchPinnedMessages(roomId, false);
            // Update pinned flags in messages
            const pinnedMsgs = this.pinnedMessages[roomId] || [];
            const msgs = this.messages[roomId] || [];
            msgs.forEach((msg) => {
              if (pinnedMsgs.some((pinned) => pinned.id === msg.id)) {
                msg.pinned = true;
              }
            });
          } catch (error) {}
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch messages";
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

    // Reply functionality
    async replyToMessage(
      channelId: string,
      content: string,
      replyToMessageId: string,
      mentionAuthor: boolean = true
    ) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const res = await fetchWithAuth<Message>(`/messages`, {
          method: "POST",
          body: JSON.stringify({
            channelId,
            content,
            replyToMessageId,
            mentionAuthor,
          }),
        });

        // Message will be added via websocket when broadcast
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to reply to message";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Pin functionality
    async pinMessage(messageId: string, channelId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();
        const toast = useToast();

        this.loading = true;
        this.error = null;

        const res = await fetchWithAuth<Message>(`/messages/${messageId}/pin`, {
          method: "PUT",
          body: JSON.stringify({ channelId }),
        });

        // Set pinned flag
        res.pinned = true;

        // Update the message in the messages array
        const messages = this.messages[channelId] || [];
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = res;
        }

        // Add to pinned messages
        if (!this.pinnedMessages[channelId]) {
          this.pinnedMessages[channelId] = [];
        }
        this.pinnedMessages[channelId].push(res);
        toast.add({
          title: "Pinned",
          description: "Message has been pinned",
          color: "success",
        });
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to pin message";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async unpinMessage(messageId: string, channelId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();
        const toast = useToast();

        this.loading = true;
        this.error = null;

        const response = await fetchWithAuth<{
          success: boolean;
          messageId: string;
        }>(`/messages/${messageId}/unpin`, {
          method: "DELETE",
          body: JSON.stringify({ channelId }),
        });

        // Find the message in the messages array and set pinned to false
        const messages = this.messages[channelId] || [];
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex]!.pinned = false;
        }

        // Remove from pinned messages
        if (this.pinnedMessages[channelId]) {
          this.pinnedMessages[channelId] = this.pinnedMessages[
            channelId
          ].filter((msg) => msg.id !== messageId);
        }

        toast.add({
          title: "Unpinned",
          description: "Message has been unpinned",
          color: "success",
        });
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to unpin message";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchPinnedMessages(channelId: string, setLoading = true) {
      const { fetchWithAuth } = useFetchWithAuth();
      try {
        if (setLoading) this.loading = true;
        this.error = null;

        const pinnedMessages = await fetchWithAuth<Message[]>(
          `/messages/channels/${channelId}/pinned`
        );

        this.pinnedMessages[channelId] = pinnedMessages.map((msg: Message) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          pinnedAt: msg.pinnedAt ? new Date(msg.pinnedAt) : undefined,
          pinned: true,
        }));
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to fetch pinned messages";
      } finally {
        if (setLoading) this.loading = false;
      }
    },

    // Thread functionality
    async createThread(
      channelId: string,
      starterMessageId: string,
      name: string,
      topic: string,
      type: ChannelType
    ) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const threadData = await fetchWithAuth<Thread>(
          `/channels/${channelId}/threads`,
          {
            method: "POST",
            body: JSON.stringify({
              name,
              topic,
              type,
              starterMessageId,
            }),
          }
        );

        // Map API response to Thread interface
        const thread: Thread = {
          id: threadData.id,
          channelId: threadData.channelId || channelId,
          starterMessageId: threadData.starterMessageId,
          name: threadData.name,
          topic: threadData.topic || "",
          type: threadData.type,
          createdAt: new Date(threadData.createdAt),
          createdBy: {
            id: threadData.createdBy?.id,
            username: threadData.createdBy?.username || "Unknown",
            avatar: threadData.createdBy?.avatar,
          },
          lastMessageAt: threadData.lastMessageAt
            ? new Date(threadData.lastMessageAt)
            : undefined,
          messageCount: threadData.messageCount || 0,
          members: threadData.members || [],
        };

        this.threads.push(thread);

        return thread;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to create thread";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchThread(threadId: string, channelId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const threadData = await fetchWithAuth<Thread>(
          `/channels/${channelId}/threads/${threadId}`
        );

        // Map API response to Thread interface
        const thread: Thread = {
          id: threadData.id,
          channelId: threadData.channelId || channelId,
          starterMessageId: threadData.starterMessageId,
          name: threadData.name,
          topic: threadData.topic || "",
          type: threadData.type,
          createdAt: new Date(threadData.createdAt),
          createdBy: {
            id: threadData.createdBy?.id,
            username: threadData.createdBy?.username || "Unknown",
            avatar: threadData.createdBy?.avatar,
          },
          lastMessageAt: threadData.lastMessageAt
            ? new Date(threadData.lastMessageAt)
            : undefined,
          messageCount: threadData.messageCount || 0,
          members: threadData.members || [],
        };

        // Find existing thread and update it, or add new one
        const existingIndex = this.threads.findIndex((t) => t.id === threadId);
        if (existingIndex >= 0) {
          this.threads[existingIndex] = thread;
        } else {
          this.threads.push(thread);
        }
        this.currentThread = thread;
        return thread;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch thread";
      } finally {
        this.loading = false;
      }
    },

    async fetchThreadsByChannel(channelId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const response = await fetchWithAuth<any>(
          `/channels/${channelId}/threads/list/all`
        );

        const threads = response.map((threadData: any) => ({
          id: threadData.id,
          channelId: threadData.parentId || channelId,
          starterMessageId: threadData.starterMessageId,
          name: threadData.name,
          topic: threadData.topic || "",
          type: threadData.type,
          createdAt: new Date(threadData.createdAt),
          createdBy: {
            id: threadData.createdBy?.id,
            username: threadData.createdBy?.username || "Unknown",
            avatar: threadData.createdBy?.avatar,
          },
          lastMessageAt: threadData.lastMessageAt
            ? new Date(threadData.lastMessageAt)
            : undefined,
          messageCount: threadData.messageCount || 0,
          members: threadData.members || [],
        }));

        // Remove existing threads for this channel
        this.threads = this.threads.filter(
          (thread) => thread.channelId !== channelId
        );

        // Add new threads
        this.threads.push(...threads);
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch threads";
      } finally {
        this.loading = false;
      }
    },

    // Send message to thread
    async sendMessageToThread(
      threadId: string,
      content: string,
      type: string = "text"
    ) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        this.loading = true;
        this.error = null;

        const res = await fetchWithAuth<Message>(
          `/threads/${threadId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              content,
              threadId,
              type,
            }),
          }
        );

        // Message will be added via websocket when broadcast
        return res;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to send message to thread";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Fetch message references for reply messages
    async fetchMessageReferences(channelId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        // Get current messages for this channel (work on a copy)
        const currentMessages = this.messages[channelId] || [];
        const replyMessageIds = currentMessages
          .filter((msg) => msg.type === 19 || msg.type === "reply")
          .map((msg) => msg.id);

        if (replyMessageIds.length === 0) {
          return; // No reply messages to fetch references for
        }

        // Fetch references for reply messages
        const references = await fetchWithAuth<any[]>(
          `/messages/references?channelId=${channelId}&messageIds=${replyMessageIds.join(
            ","
          )}`
        );

        if (!references || references.length === 0) return;

        // Normalize and map references by the id of the message that references another
        const refsBySource: Record<string, any> = {};
        references.forEach((r) => {
          // Possible shapes: { referenceBy, referencedMessage },
          // or { referenceBy, messageRef }, or { referenceById, messageRef }
          const sourceId = r.referenceBy || r.referenceById || r.reference_by;
          const refMsg =
            r.referencedMessage ||
            r.messageRef ||
            r.message_ref ||
            r.reference?.messageRef;
          if (sourceId && refMsg) {
            refsBySource[sourceId] = refMsg;
          }
        });

        // Create a new messages array to ensure reactivity
        const updatedMessages = currentMessages.map((m) => {
          const ref = refsBySource[m.id];
          if (!ref) return m;

          // Normalize referenced author
          const author =
            ref.author || ref.authorProfile || ref.messageAuthor || null;

          return {
            ...m,
            replyTo: {
              id: ref.id,
              content: ref.content,
              author: {
                id: author?.id,
                username: author?.username || author?.name || "Unknown",
                avatar: author?.avatar,
              },
            },
          };
        });

        // Assign back to trigger reactivity in Vue
        this.messages[channelId] = updatedMessages;
      } catch (error) {}
    },

    // Get unread count for a channel or thread (same API)
    async getUnreadCount(channelOrThreadId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        const response = await fetchWithAuth<{
          channelId: string;
          unreadCount: number;
        }>(`/messages/channels/${channelOrThreadId}/unread-count`, {
          method: "GET",
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    // Mark channel or thread as read via API (same endpoint for both)
    async markChannelAsRead(channelOrThreadId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        const response = await fetchWithAuth<{
          success: boolean;
          lastReadMessageId: string | null;
          unreadCount: number;
        }>(`/messages/${channelOrThreadId}/read`, {
          method: "POST",
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get community unread count (all channels in a guild)
    async getCommunityUnreadCount(guildId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        const response = await fetchWithAuth<{
          guildId: string;
          totalUnreadCount: number;
        }>(`/messages/communities/${guildId}/unread-count`, {
          method: "GET",
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get unread counts for all channels in a community
    async getCommunityChannelsUnreadCount(guildId: string) {
      try {
        const { fetchWithAuth } = useFetchWithAuth();

        const response = await fetchWithAuth<{
          guildId: string;
          channels: Array<{
            channelId: string;
            unreadCount: number;
          }>;
        }>(`/messages/communities/${guildId}/channels-unread-count`, {
          method: "GET",
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    // Mark message as deleted locally
    deleteMessage(channelId: string, messageId: string) {
      if (!this.messages[channelId]) return;

      const messages = this.messages[channelId]!;
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);

      if (messageIndex !== -1) {
        messages[messageIndex] = {
          ...messages[messageIndex]!,
          deleted: true,
          deletedAt: new Date(),
        };
      }

      // Remove from pinned messages if it was pinned
      if (this.pinnedMessages[channelId]) {
        this.pinnedMessages[channelId] = this.pinnedMessages[channelId].filter(
          (msg) => msg.id !== messageId
        );
      }
    },
  },
});
