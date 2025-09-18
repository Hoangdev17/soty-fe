import { defineStore } from "pinia";
import { io } from "socket.io-client";
import type {
  WebSocketState,
  WebSocketMessage,
  GetMembersPayload,
  WebSocketResponse,
  MembersListData,
  MembersListPayload,
  JoinedCommunityPayload,
  CreateChannelPayload,
  ChannelCreatedData,
} from "./websocket.type";
import { useMessageStore } from "../message/message.store";
import { useMemberStore } from "../member/member.store";
import type {
  Message,
  Thread,
  PinMessageResponse,
} from "../message/message.type";
import type { Member } from "../member/member.type";
import { useChannelStore } from "../channels/channel.store";
import { useCommunityStore } from "../community/community.store";

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

          // Normalize reply/reference shapes from backend so frontend always gets `replyTo` with {id, content, author}
          const normalizeReply = () => {
            // If backend already provides replyTo, prefer it
            if (data.replyTo) {
              return {
                id: data.replyTo.id,
                content: data.replyTo.content,
                author: {
                  id: data.replyTo.author?.id,
                  username: data.replyTo.author?.username || "Unknown",
                  avatar: data.replyTo.author?.avatar,
                },
              };
            }

            // Some payloads include `references` array with nested messageRef / referencedMessage
            const refs = (data as any).references || (data as any).References;
            if (Array.isArray(refs) && refs.length > 0) {
              const first = refs[0];
              const refMsg =
                first.messageRef ||
                first.referencedMessage ||
                first.message_ref ||
                first.message ||
                first.messageRef;
              if (refMsg) {
                const author = refMsg.author || refMsg.authorProfile || null;
                return {
                  id: refMsg.id,
                  content: refMsg.content,
                  author: {
                    id: author?.id,
                    username: author?.username || author?.name || "Unknown",
                    avatar: author?.avatar,
                  },
                };
              }
            }

            // Some payloads might include a `reference` object
            const ref =
              (data as any).reference || (data as any).referenceMessage;
            if (ref) {
              const refMsg = ref.messageRef || ref.referencedMessage || ref;
              const author = refMsg.author || refMsg.authorProfile || null;
              return {
                id: refMsg.id,
                content: refMsg.content,
                author: {
                  id: author?.id,
                  username: author?.username || author?.name || "Unknown",
                  avatar: author?.avatar,
                },
              };
            }

            return undefined;
          };

          const message: Message = {
            id: data.id,
            content: data.content || (data as any).message || "",
            room: data.room,
            type: data.type,
            metadata: data.metadata,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            createdAt: new Date(data.createdAt),
            channelId: data.channelId,
            channelName: data.channelName,
            author: {
              id: data.author?.id,
              username: data.author?.username || "Unknown",
              avatar: data.author?.avatar,
            },
            replyTo: normalizeReply(),
          };

          messageStore.receiveMessage(
            message.metadata?.channelId ||
              message.metadata?.threadId ||
              message.room?.replace("channel_", "") ||
              message.room?.replace("thread_", "") ||
              "",
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

        // Listen for members list event
        this.connection.on("members_list", (data: any) => {
          const memberStore = useMemberStore();

          const membersListPayload = data as MembersListPayload;

          // Update member store with the received members data
          memberStore.handleWebSocketMembersList(membersListPayload);

          // Also keep in websocket messages for debugging/logging
          const wsMessage: WebSocketMessage = {
            type: "members_list",
            payload: data,
            timestamp: Date.now(),
          };
          this.messages.push(wsMessage);
        });

        //join community
        this.connection.on("member_joined", (data: JoinedCommunityPayload) => {
          const memberStore = useMemberStore();
          const communityId = data.communityId;

          // Ensure members array exists for the community
          if (!memberStore.members[communityId]) {
            memberStore.members[communityId] = [];
          }

          // Add the new member (assuming data.members is a single Member object)
          const newMember: Member = data.members;

          memberStore.members[communityId].push(newMember);

          // Increment member count
          if (memberStore.memberCount !== null) {
            memberStore.memberCount++;
          } else {
            memberStore.memberCount = memberStore.members[communityId].length;
          }
        });

        //create channel
        this.connection.on("channel_created", (data: ChannelCreatedData) => {
          const toast = useToast();
          const channelStore = useChannelStore();

          // Add channel to all clients' channel list
          channelStore.channels.push(data.channel);
        });

        //created thread
        this.connection.on("created_thread", (data: Thread) => {
          const messageStore = useMessageStore();
          const toast = useToast();
          // Handle thread created event
          messageStore.threads.push(data);

          toast.add({
            title: "Chủ đề mới đã được tạo! Hãy tham gia thảo luận nào!",
            color: "success",
            duration: 5000,
          });
        });

        //pin message
        this.connection.on("messages_pinned", (data: PinMessageResponse) => {
          const messageStore = useMessageStore();
          const channelStore = useChannelStore();
          const toast = useToast();

          console.log("Pinned message data:", data);

          const message = data.formatted;
          const channelId = data.channelId;

          // Ensure the messages array exists for the channel
          if (!messageStore.messages[channelId]) {
            messageStore.messages[channelId] = [];
          }
          let messages = messageStore.messages[channelId]!;
          const existingIndex = messages.findIndex(
            (msg) => msg.id === message.id
          );
          if (existingIndex === -1) {
            // Add the message if not exists
            messages.push(message);
          } else {
            // Update existing message
            messages[existingIndex] = message;
          }

          // Set pinned flag
          const messageIndex = messages.findIndex(
            (msg) => msg.id === message.id
          );
          if (messageIndex !== -1) {
            messages[messageIndex]!.pinned = true;
          }

          // Ensure the pinnedMessages array exists
          if (!messageStore.pinnedMessages[channelId]) {
            messageStore.pinnedMessages[channelId] = [];
          }

          messageStore.pinnedMessages[channelId]!.push(message);
        });

        //unpin message
        this.connection.on(
          "messages_unpinned",
          (data: { channelId: string; messageId: string }) => {
            const messageStore = useMessageStore();
            const channelStore = useChannelStore();
            const toast = useToast();

            // Update the message in the messages array to reflect unpinned state
            if (messageStore.messages[data.channelId]) {
              const messages = messageStore.messages[data.channelId]!;
              const messageIndex = messages.findIndex(
                (msg) => msg.id === data.messageId
              );
              if (messageIndex !== -1) {
                messages[messageIndex]!.pinned = false;
              }
            }

            // Remove from pinned messages
            if (messageStore.pinnedMessages[data.channelId]) {
              messageStore.pinnedMessages[data.channelId] =
                messageStore.pinnedMessages[data.channelId]!.filter(
                  (msg) => msg.id !== data.messageId
                );
            }
          }
        );
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
      if (this.connection && this.isConnected) {
        this.sendMessage("join_room", { room });
      } else {
        console.warn(`⚠️ Cannot join room ${room}: Socket.IO is not connected`);
      }
    },

    leaveRoom(room: string) {
      if (this.connection && this.isConnected) {
        this.sendMessage("leave", { room });
      } else {
        console.warn(
          `⚠️ Cannot leave room ${room}: Socket.IO is not connected`
        );
      }
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

    getMembers(communityId: string) {
      if (this.connection && this.isConnected) {
        this.connection.emit("get_members", { communityId });
      } else {
        console.warn(
          `⚠️ Cannot emit get_members for community ${communityId}: Socket.IO is not connected`
        );
      }
    },
    //create channel
    createChannel(data: CreateChannelPayload) {
      if (this.connection && this.isConnected) {
        this.connection.emit("create_channel", data);
      } else {
        console.warn(
          `⚠️ Cannot create channel in guild ${data.guildId}: Socket.IO is not connected`
        );
      }
    },

    // Method to ensure room is joined (with retry logic)
    ensureRoomJoined(room: string, maxRetries: number = 3) {
      if (this.connection && this.isConnected) {
        this.joinRoom(room);
      } else if (maxRetries > 0) {
        console.log(
          `⏳ WebSocket not connected, retrying join room ${room} in 1s... (${maxRetries} retries left)`
        );
        setTimeout(() => {
          this.ensureRoomJoined(room, maxRetries - 1);
        }, 1000);
      } else {
        console.error(
          `❌ Failed to join room ${room} after ${maxRetries} retries`
        );
      }
    },

    clearMessages() {
      this.messages = [];
    },
  },
});
