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
import type { Message } from "../message/message.type";
import type { Member } from "../member/member.type";
import { useChannelStore } from "../channels/channel.store";

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
          const toast = useToast();
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

          toast.add({
            title:
              newMember.user?.username + "vừa trượt vào cộng đồng của bạn!",
            color: "success",
            duration: 5000,
          });
        });

        //create channel
        this.connection.on("channel_created", (data: ChannelCreatedData) => {
          const toast = useToast();
          const channelStore = useChannelStore();

          channelStore.channels.push(data.channel);
          channelStore.currentChannel = data.channel;

          toast.add({
            title:
              "Kênh " +
              data.channel.name +
              "mới xuất hiện kìa! Hãy cùng khám phá nào!",
            color: "success",
            duration: 5000,
          });
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
      if (this.connection && this.isConnected) {
        this.connection.emit("send_message", {
          room,
          message,
          type,
          metadata,
        });
      } else {
        console.warn(
          `⚠️ Cannot send message to room ${room}: Socket.IO is not connected`
        );
      }
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

    joinCommunityRoom(communityId: string, userId: string) {
      if (this.connection && this.isConnected) {
        this.connection.emit("member_joined", { communityId, userId });
      } else {
        console.warn(
          `⚠️ Cannot join community room community_${communityId}: Socket.IO is not connected`
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
