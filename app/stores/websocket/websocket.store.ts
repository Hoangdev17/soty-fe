import { defineStore } from "pinia";
import { io } from "socket.io-client";
import { nextTick } from "vue";
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
import { useAuthStore } from "../auth/auth.store";
import { toast } from "#build/ui";
import {
  PresenceStatus,
  type FriendRequest,
  type getRequestSentPayload,
  type User,
} from "../auth/auth.type";

export const useWebSocketStore = defineStore("websocket", {
  state: (): WebSocketState => ({
    isConnected: false,
    connection: null,
    messages: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    // Unread messages state
    unreadByChannel: {} as Record<string, Set<string>>,
    isUnreadStateRestored: false,
    joinedRooms: new Set<string>(),
    // messageId -> timestamp (ms) để hỗ trợ partial clear theo lastRead timestamp
    messageTimestamps: {} as Record<string, number>,
    // channelId -> communityId (nếu channel thuộc community)
    channelToCommunity: {} as Record<string, string | undefined>,
    // Cache để tránh fetch unread quá nhiều lần
    unreadCacheByChannel: {} as Record<
      string,
      { count: number; lastFetched: number }
    >,
    unreadCacheByCommunity: {} as Record<
      string,
      { count: number; lastFetched: number }
    >,
    // Flag để chỉ init unread 1 lần
    isUnreadInitialized: false,
    // Track toast shown for messages to prevent duplicates
    toastShownForMessages: new Set<string>(),
    // Voice channel users
    usersInRoom: [],
    usersInfo: {},
    // mapping from userId -> socketId when we learn it
    userIdToSocketId: {},
  }),

  getters: {
    getMessages: (state) => state.messages,
    isWebSocketConnected: (state) => state.isConnected,
    // trả về function để lấy tổng unread cho community
    getCommunityUnreadCount: (state) => (communityId: string) =>
      Object.keys(state.unreadByChannel).reduce((acc, chId) => {
        const mapped = state.channelToCommunity[chId];
        if (mapped && String(mapped) === String(communityId)) {
          return acc + (state.unreadByChannel[chId]?.size || 0);
        }
        return acc;
      }, 0),
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

          // debug: connection id and auth user
          const authStore = useAuthStore();

          // Inform server about current user (server should update user->socket mapping)
          try {
            const uid = authStore.user?.id || (authStore.user as any)?.sub;
            if (uid) {
              this.sendMessage("identify", { userId: String(uid) });

              // Auto-join user room for DM and notifications after identifying
              const userRoom = `user_${uid}`;
              setTimeout(() => {
                this.joinRoom(userRoom);
              }, 100);
            }
          } catch (e) {}

          setTimeout(() => {
            this.syncUnreadState();
          }, 500);
        });

        this.connection.on("disconnect", (reason: string) => {
          this.isConnected = false;

          // Auto-reconnect for recoverable disconnects
          if (
            reason === "io server disconnect" ||
            reason === "transport close"
          ) {
            setTimeout(() => {
              if (
                !this.isConnected &&
                this.reconnectAttempts < this.maxReconnectAttempts
              ) {
                this.reconnectAttempts++;

                this.connect(url, token);
              }
            }, 1000 * this.reconnectAttempts);
          }
        });

        this.connection.on("connect_error", (error: Error) => {
          this.isConnected = false;

          // Retry connection with exponential backoff
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, this.reconnectAttempts),
              10000
            );

            setTimeout(() => {
              if (!this.isConnected) {
                this.connect(url, token);
              }
            }, delay);
          } else {
          }
        });

        // Listen for custom message events
        this.connection.on("message", (data: Message) => {
          const messageStore = useMessageStore();
          const toast = useToast();

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
            guildId: data.guildId,
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

          // Add to unread messages (only if not sent by current user)
          const channelId =
            message.channelId || message.room?.replace("channel_", "");
          // Try to extract communityId from payload (server should include it if available)
          const communityId = message.metadata?.communityId || undefined;

          // Get current user ID to check if message is from self
          const authStore = useAuthStore();
          const currentUserId =
            authStore.user?.id ?? (authStore.user as any)?.sub ?? null;

          // Only add to unread if message is not from current user
          if (channelId && message.author?.id !== currentUserId) {
            this.addUnread(
              channelId,
              message.id,
              message.createdAt?.getTime() || Date.now(),
              communityId
            );

            // Only show toast once per message and if user is not in the current channel
            if (!this.toastShownForMessages.has(message.id)) {
              this.toastShownForMessages.add(message.id);

              // Check if user is currently viewing this channel
              const currentRoute = useRoute();
              const isInSameChannel =
                currentRoute.params.channel_id === channelId ||
                currentRoute.params.channelId === channelId;

              // Only show toast if user is not in the same channel
              if (!isInSameChannel) {
                if (authStore.user?.username === message.channelName) {
                  toast.add({
                    title: `${message.author?.username} mới gửi tin nhắn tới bạn`,
                    description: message.content,
                  });
                } else {
                  // Only show toast for messages from other users
                  toast.add({
                    title: `${message.author?.username} mới gửi tin nhắn tới ${message.channelName}`,
                    description: message.content,
                  });
                }
              }
            }
          } else if (message.author?.id === currentUserId) {
          }
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

        this.connection.on("read_update", (data: any) => {
          const { channelId, userId, lastReadMessageId, lastRead, system } =
            data;

          const targetChannelId = String(channelId);
          const authStore = useAuthStore();
          const currentUserId =
            authStore.user?.id ?? (authStore.user as any)?.sub ?? null;
          const eventUserId = userId ?? null;

          // If auth not ready, ignore (or implement queue if you need to process later)
          if (!currentUserId) {
            return;
          }

          // If event contains a userId, only process if it's our user
          if (eventUserId) {
            if (String(eventUserId) !== String(currentUserId)) {
              return;
            }
          } else {
            // If no userId and server didn't mark as system-wide, ignore to avoid clearing everyone's unread
            if (!system) {
              return;
            }
          }

          // Relevant to this client -> clear unread + caches and persist lastRead
          this.clearUnread(targetChannelId);
          const communityId = this.channelToCommunity[targetChannelId];
          if (communityId) {
            this.clearUnreadCache(communityId);
          }
          this.clearUnreadCache(targetChannelId);

          if (lastReadMessageId) {
            try {
              localStorage.setItem(
                `lastRead_${targetChannelId}`,
                lastReadMessageId
              );
              localStorage.setItem(
                `lastReadTime_${targetChannelId}`,
                lastRead || new Date().toISOString()
              );
            } catch (e) {}
          }
        });

        this.connection.on("auth_error", async () => {
          const { handleRefreshToken } = useFetchWithAuth();
          const authStore = useAuthStore();
          try {
            await handleRefreshToken();
            const newToken = authStore.token;
            if (newToken && !this.isConnected) {
              this.disconnect();
              this.connect(url, newToken);
            }
          } catch (error) {
            authStore.logout();
          }
        });

        this.connection.on(
          "room_users",
          (data: {
            users: Array<{
              id: string;
              username?: string;
              avatar?: string;
              socketId?: string;
            }>;
            requestedBy: string;
            timestamp: Date;
          }) => {
            const users = data.users || [];

            // Build a fresh map for users currently in this room.
            // Use socketId as canonical key when known; otherwise create a temporary placeholder keyed by user.id.
            const newUsersInfo: Record<string, any> = {};
            const newRoomKeys: string[] = [];

            users.forEach((user) => {
              const username = user.username ?? "Unknown";
              const avatar = user.avatar ?? "";

              // Prefer socketId from payload; fallback to any known mapping
              const socketIdFromPayload = user.socketId;
              const knownSocketId =
                socketIdFromPayload ?? this.userIdToSocketId?.[user.id];

              if (knownSocketId) {
                // remember mapping if payload provided socketId
                if (user.id && socketIdFromPayload) {
                  this.userIdToSocketId![user.id] = socketIdFromPayload;
                }

                newUsersInfo[knownSocketId] = {
                  id: user.id,
                  socketId: knownSocketId,
                  avatar,
                  username,
                  name: username,
                  displayName: username,
                  isVideoEnabled: false,
                  isAudioEnabled: false,
                } as any;
                newRoomKeys.push(knownSocketId);
              } else {
                newUsersInfo[user.id] = {
                  id: user.id,
                  socketId: undefined,
                  avatar,
                  username,
                  name: username,
                  displayName: username,
                  isPlaceholder: true,
                  isVideoEnabled: false,
                  isAudioEnabled: false,
                } as any;
                newRoomKeys.push(user.id);
              }
            });

            this.usersInfo = newUsersInfo;
            this.usersInRoom = [...newRoomKeys];
          }
        );

        // Single canonical user_joined handler: map userId -> socketId and migrate placeholder -> socketId
        this.connection.on(
          "user_joined",
          (data: {
            socketId: string;
            room: string;
            user?: {
              id?: string;
              username?: string;
              avatar?: string;
              name?: string;
            };
            isVideoEnabled?: boolean;
            isAudioEnabled?: boolean;
          }) => {
            const socketId = data.socketId;
            const user = data.user ?? null;
            const room = data.room ?? "";

            if (!room.startsWith("channel_") || !room.endsWith("_init")) {
              return;
            }

            if (!socketId) return;

            if (user && user.id) {
              // remember mapping
              this.userIdToSocketId![user.id] = socketId;

              // Prefer any existing placeholder or socket entry
              const placeholder = this.usersInfo[user.id];
              const prevSocketEntry = this.usersInfo[socketId];
              const prev = placeholder ?? prevSocketEntry ?? null;

              const combined = {
                id: user.id,
                socketId,
                avatar: user.avatar ?? prev?.avatar ?? "",
                username:
                  user.username ?? prev?.username ?? user.name ?? "Unknown",
                name: user.username ?? prev?.name ?? user.name ?? "",
                isVideoEnabled:
                  data.isVideoEnabled ?? prev?.isVideoEnabled ?? false,
                isAudioEnabled:
                  data.isAudioEnabled ?? prev?.isAudioEnabled ?? false,
              } as any;

              // Canonical store under socketId only, remove placeholder keyed by user.id
              if (this.usersInfo[user.id]) {
                const copy = { ...this.usersInfo };
                delete copy[user.id];
                copy[socketId] = combined;
                this.usersInfo = copy;
              } else {
                this.usersInfo = { ...this.usersInfo, [socketId]: combined };
              }

              // Replace user.id key in usersInRoom with socketId (if present)
              this.usersInRoom = this.usersInRoom.map((k) =>
                k === user.id ? socketId : k
              );

              // Ensure socketId present (deduped)
              if (!this.usersInRoom.includes(socketId)) {
                this.usersInRoom = [...this.usersInRoom, socketId];
              }

              // Trigger reactivity
              this.usersInfo = { ...this.usersInfo };
              this.usersInRoom = [...this.usersInRoom];
            } else {
              // No app user id provided: ensure socketId entry exists
              const prev = this.usersInfo[socketId] ?? null;
              this.usersInfo = {
                ...this.usersInfo,
                [socketId]: {
                  avatar: prev?.avatar ?? "",
                  username: prev?.username ?? "Unknown",
                  name: prev?.name ?? "",
                  isVideoEnabled:
                    data.isVideoEnabled ?? prev?.isVideoEnabled ?? false,
                  isAudioEnabled:
                    data.isAudioEnabled ?? prev?.isAudioEnabled ?? false,
                },
              };
              if (!this.usersInRoom.includes(socketId)) {
                this.usersInRoom = [...this.usersInRoom, socketId];
              }
              this.usersInfo = { ...this.usersInfo };
              this.usersInRoom = [...this.usersInRoom];
            }
          }
        );

        this.connection.on(
          "user_left",
          (data: {
            socketId?: string;
            room?: string;
            user?: { id?: string };
          }) => {
            try {
              const socketIdFromPayload = data?.socketId;
              const userIdFromPayload = data?.user?.id;

              // Resolve socketId if only userId provided
              const resolvedSocketId =
                socketIdFromPayload ??
                (userIdFromPayload
                  ? this.userIdToSocketId?.[userIdFromPayload]
                  : undefined);

              // Remove mapping userId -> socketId if present
              if (
                userIdFromPayload &&
                this.userIdToSocketId?.[userIdFromPayload]
              ) {
                const copyMap = { ...(this.userIdToSocketId || {}) };
                delete copyMap[userIdFromPayload];
                this.userIdToSocketId = copyMap;
              }

              // Remove entries from usersInfo (both socket-keyed and placeholder keyed by userId)
              const infoCopy: Record<string, any> = {
                ...(this.usersInfo || {}),
              };
              if (resolvedSocketId && infoCopy[resolvedSocketId])
                delete infoCopy[resolvedSocketId];
              if (userIdFromPayload && infoCopy[userIdFromPayload])
                delete infoCopy[userIdFromPayload];
              this.usersInfo = infoCopy;

              // Remove keys from usersInRoom (match both socketId and userId placeholders)
              this.usersInRoom = (this.usersInRoom || []).filter(
                (k: string) => k !== resolvedSocketId && k !== userIdFromPayload
              );
            } catch (e) {}
          }
        );

        this.connection.on("friend_request", (data: getRequestSentPayload) => {
          try {
            const authStore = useAuthStore();
            const toast = useToast();
            authStore.friendRequest?.push(data);

            toast.add({
              title: `${data.sender.username} đã gửi cho bạn lời mời kết bạn`,
              color: "success",
            });
          } catch (e) {}
        });

        this.connection.on("presence_online_friend", async (userId: string) => {
          const authStore = useAuthStore();
          const { friends } = storeToRefs(authStore);

          if (!friends.value) return;

          const index = friends.value.findIndex((a) => a.id === userId);
          const user = friends.value[index];
          if (!user || !user.id) return;

          friends.value[index] = {
            ...user,
            presence: {
              status: PresenceStatus.ONLINE,
              customText: "",
              activities: [],
              lastUpdated: new Date(),
            },
          };
        });

        this.connection.on("online", (data: any) => {
          const authStore = useAuthStore();

          if (!authStore.user) return;

          authStore.user.presence = {
            ...authStore.user.presence,
            status: PresenceStatus.ONLINE,
            customText: data.customText ?? "",
            activities: data.activities ?? [],
            lastUpdated: new Date(),
          };
        });

        this.connection.on(
          "presence_offline_friend",
          async (userId: string) => {
            const authStore = useAuthStore();
            const { friends } = storeToRefs(authStore);

            if (!friends.value) return;

            const index = friends.value.findIndex((a) => a.id === userId);
            const user = friends.value[index];
            if (!user || !user.id) return;

            friends.value[index] = {
              ...user,
              presence: {
                status: PresenceStatus.OFFLINE,
                customText: "",
                activities: [],
                lastUpdated: new Date(),
              },
            };
          }
        );

        this.connection.on("presence_online_community", (userId: string) => {
          const memberStore = useMemberStore();
          const { members } = storeToRefs(memberStore);

          if (!members.value) return;

          const allMembers = Object.values(members.value).flat();

          const member = allMembers.find((m) => m.user?.id === userId);
          if (!member || !member.user) return;

          // update presence
          member.user.presence = {
            status: PresenceStatus.ONLINE,
            customText: "",
            activities: [],
            lastUpdated: new Date(),
          };
        });

        this.connection.on("presence_offline_community", (userId: string) => {
          const memberStore = useMemberStore();
          const { members } = storeToRefs(memberStore);

          if (!members.value) return;

          const allMembers = Object.values(members.value).flat();

          const member = allMembers.find((m) => m.user?.id === userId);
          if (!member || !member.user) return;

          // update presence
          member.user.presence = {
            status: PresenceStatus.OFFLINE,
            customText: "",
            activities: [],
            lastUpdated: new Date(),
          };
        });
      } catch (error) {}
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
      }
    },

    // Specific methods for your backend events
    joinRoom(room: string) {
      if (this.connection && this.isConnected) {
        this.sendMessage("join_room", { room });
      } else {
      }
    },

    leaveRoom(room: string) {
      if (this.connection && this.isConnected) {
        this.sendMessage("leave", { room });
      } else {
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
      }
    },
    //create channel
    createChannel(data: CreateChannelPayload) {
      if (this.connection && this.isConnected) {
        this.connection.emit("create_channel", data);
      } else {
      }
    },

    // Method to ensure room is joined (with retry logic)
    ensureRoomJoined(room: string, maxRetries: number = 3) {
      if (this.connection && this.isConnected) {
        this.joinRoom(room);
      } else if (maxRetries > 0) {
        setTimeout(() => {
          this.ensureRoomJoined(room, maxRetries - 1);
        }, 1000);
      } else {
      }
    },

    clearMessages() {
      this.messages = [];
    },

    // Unread messages methods
    addUnread(
      channelId: string,
      messageId: string,
      timestamp?: number,
      communityId?: string
    ) {
      if (!channelId || !messageId) return;
      if (communityId) {
        this.channelToCommunity[String(channelId)] = String(communityId);
      }
      if (!this.unreadByChannel[channelId])
        this.unreadByChannel[channelId] = new Set();
      this.unreadByChannel[channelId].add(messageId);
      if (timestamp) {
        this.messageTimestamps[String(messageId)] = timestamp;
      }
      this.saveUnreadToStorage(channelId);

      // Clear community cache to trigger refresh when new message added
      if (communityId) {
        this.clearUnreadCache(communityId);
      }

      // Trigger reactivity update
      this.unreadByChannel = { ...this.unreadByChannel };
    },

    clearUnread(channelId: string) {
      if (!channelId) return;
      const oldCount = this.unreadByChannel[channelId]?.size || 0;

      // Get community ID before clearing
      const communityId = this.channelToCommunity[channelId];

      // remove timestamps for removed message ids
      const set = this.unreadByChannel[channelId];
      if (set) {
        for (const mid of set) {
          delete this.messageTimestamps[String(mid)];
        }
      }
      delete this.unreadByChannel[channelId];
      this.unreadByChannel[channelId] = new Set();
      this.clearUnreadFromStorage(channelId);

      // Clear community cache to trigger refresh
      if (communityId && oldCount > 0) {
        this.clearUnreadCache(communityId);
      }

      // Trigger reactivity update by modifying the object reference
      this.unreadByChannel = { ...this.unreadByChannel };
    },

    getUnreadCount(channelId: string) {
      const s = this.unreadByChannel[channelId];
      const count = s ? s.size : 0;
      return count;
    },

    // Helper để lấy tổng unread của community (local state)
    getUnreadCountForCommunity(communityId: string) {
      const result = Object.keys(this.unreadByChannel).reduce((acc, chId) => {
        if (
          this.channelToCommunity[chId] &&
          String(this.channelToCommunity[chId]) === String(communityId)
        ) {
          return acc + (this.unreadByChannel[chId]?.size || 0);
        }
        return acc;
      }, 0);

      return result;
    },

    // Fetch unread count từ API cho community với cache
    async fetchCommunityUnreadCount(communityId: string, forceRefresh = false) {
      const cacheKey = communityId;
      const now = Date.now();
      const cacheExpiry = 30000; // 30 seconds cache

      // Check cache first unless force refresh
      if (!forceRefresh && this.unreadCacheByCommunity[cacheKey]) {
        const cache = this.unreadCacheByCommunity[cacheKey];
        if (now - cache.lastFetched < cacheExpiry) {
          return cache.count;
        }
      }

      try {
        const { getCommunityUnreadCount } = await import(
          "../message/message.action"
        );
        const response = await getCommunityUnreadCount(communityId);

        // Update cache
        this.unreadCacheByCommunity[cacheKey] = {
          count: response.totalUnreadCount,
          lastFetched: now,
        };

        return response.totalUnreadCount;
      } catch (error) {
        // Fallback to local state
        return this.getUnreadCountForCommunity(communityId);
      }
    },

    // Fetch unread count từ API cho channel với cache
    async fetchChannelUnreadCount(channelId: string, forceRefresh = false) {
      const cacheKey = channelId;
      const now = Date.now();
      const cacheExpiry = 30000; // 30 seconds cache

      // Check cache first unless force refresh
      if (!forceRefresh && this.unreadCacheByChannel[cacheKey]) {
        const cache = this.unreadCacheByChannel[cacheKey];
        if (now - cache.lastFetched < cacheExpiry) {
          return cache.count;
        }
      }

      try {
        const { getUnreadCount } = await import("../message/message.action");
        const response = await getUnreadCount(channelId);

        // Update cache
        this.unreadCacheByChannel[cacheKey] = {
          count: response.unreadCount,
          lastFetched: now,
        };

        return response.unreadCount;
      } catch (error) {
        // Fallback to local state
        return this.unreadByChannel[channelId]?.size || 0;
      }
    },

    // Initialize unread state - chỉ gọi 1 lần
    async initializeUnreadState(communityIds: string[] = []) {
      if (this.isUnreadInitialized) {
        return;
      }

      try {
        // Fetch unread counts for all communities
        const promises = communityIds.map(async (communityId) => {
          try {
            const count = await this.fetchCommunityUnreadCount(
              communityId,
              true
            );
            return { communityId, count };
          } catch (error) {
            return { communityId, count: 0 };
          }
        });

        await Promise.all(promises);

        this.isUnreadInitialized = true;
      } catch (error) {}
    },

    // Clear cache khi cần fresh data
    clearUnreadCache(target?: string) {
      if (target) {
        delete this.unreadCacheByChannel[target];
        delete this.unreadCacheByCommunity[target];
      } else {
        this.unreadCacheByChannel = {};
        this.unreadCacheByCommunity = {};
      }
    },

    // Method để set channel to community mapping
    setChannelToCommunityMapping(channelId: string, communityId: string) {
      if (channelId && communityId) {
        this.channelToCommunity[String(channelId)] = String(communityId);
      }
    },

    // Method để set multiple channel mappings (useful when fetching channels)
    setChannelMappings(mappings: Record<string, string>) {
      Object.entries(mappings).forEach(([channelId, communityId]) => {
        this.setChannelToCommunityMapping(channelId, communityId);
      });
    },

    // Sync unread counts from API data
    syncUnreadCountsFromAPI(
      channelUnreadData: Array<{ channelId: string; unreadCount: number }>
    ) {
      channelUnreadData.forEach(({ channelId, unreadCount }) => {
        if (unreadCount > 0) {
          // If we don't have local unread data, create placeholder unread messages
          if (
            !this.unreadByChannel[channelId] ||
            this.unreadByChannel[channelId].size !== unreadCount
          ) {
            // Create a Set with placeholder message IDs to match the unread count
            const placeholderMessages = new Set<string>();
            for (let i = 0; i < unreadCount; i++) {
              placeholderMessages.add(`api_unread_${channelId}_${i}`);
            }
            this.unreadByChannel[channelId] = placeholderMessages;

            // Save to storage
            this.saveUnreadToStorage(channelId);
          }
        } else {
          // Clear any local unread data if API says 0 unread
          if (
            this.unreadByChannel[channelId] &&
            this.unreadByChannel[channelId].size > 0
          ) {
            this.clearUnread(channelId);
          }
        }
      });
    },

    // LocalStorage methods for unread messages
    saveUnreadToStorage(channelId: string) {
      if (!channelId || !this.unreadByChannel[channelId]) return;
      try {
        const unreadArray = Array.from(this.unreadByChannel[channelId]);
        localStorage.setItem(
          `unreadMessages_${channelId}`,
          JSON.stringify(unreadArray)
        );
      } catch (error) {}
    },

    loadUnreadFromStorage(channelId: string): Set<string> {
      if (!channelId) return new Set();
      try {
        const stored = localStorage.getItem(`unreadMessages_${channelId}`);
        if (stored) {
          const unreadArray = JSON.parse(stored);

          return new Set(unreadArray);
        }
      } catch (error) {}
      return new Set();
    },

    clearUnreadFromStorage(channelId: string) {
      if (!channelId) return;
      try {
        localStorage.removeItem(`unreadMessages_${channelId}`);
      } catch (error) {}
    },

    // Restore unread state from localStorage
    restoreUnreadState() {
      if (this.isUnreadStateRestored) {
        return;
      }

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("unreadMessages_")) {
            const channelId = key.replace("unreadMessages_", "");
            const unreadSet = this.loadUnreadFromStorage(channelId);
            if (unreadSet.size > 0) {
              this.unreadByChannel[channelId] = unreadSet;
            }
          }
        }
      } catch (error) {}

      this.isUnreadStateRestored = true;
    },

    // Send read receipt with optimistic updates - prioritize socket over API for performance
    async sendReadReceipt(
      channelOrThreadId: string,
      lastReadMessageId: string
    ) {
      if (!channelOrThreadId) {
        return;
      }

      const validId = String(channelOrThreadId).trim();
      if (!validId || validId === "undefined" || validId === "null") {
        return;
      }

      if (!lastReadMessageId) {
        return;
      }

      // Clear unread immediately (optimistic update)
      this.clearUnread(validId);

      // Clear cache to force fresh data on next request
      this.clearUnreadCache(validId);

      // Clear community cache if this channel belongs to a community
      const communityId = this.channelToCommunity[validId];
      if (communityId) {
        this.clearUnreadCache(communityId);
      }

      // Persist lastRead locally
      try {
        localStorage.setItem(`lastRead_${validId}`, lastReadMessageId || "");
        localStorage.setItem(
          `lastReadTime_${validId}`,
          new Date().toISOString()
        );
      } catch (e) {}

      // Prioritize WebSocket for real-time updates (faster and more efficient)
      const roomName =
        validId.startsWith("thread_") || this.isThreadId(validId)
          ? `thread_${validId.replace("thread_", "")}`
          : `channel_${validId}`;
      this.ensureRoomJoined(roomName);

      const payload = {
        channelId: validId,
        lastReadMessageId: lastReadMessageId,
        lastRead: new Date().toISOString(),
      };

      this.sendMessage("channel_read", payload);
    },

    // Helper to determine if ID is a thread
    isThreadId(id: string): boolean {
      // You can implement your own logic here
      // For now, assume threads have specific naming pattern or check against thread store
      return id.includes("thread") || id.startsWith("th_");
    },

    // Get last read message ID from localStorage
    getLastReadMessageId(channelId: string): string | null {
      if (!channelId) return null;
      try {
        return localStorage.getItem(`lastRead_${channelId}`);
      } catch (error) {
        return null;
      }
    },

    // Get last read time from localStorage
    getLastReadTime(channelId: string): string | null {
      if (!channelId) return null;
      try {
        return localStorage.getItem(`lastReadTime_${channelId}`);
      } catch (error) {
        return null;
      }
    },

    // Sync unread state with server (useful for when user reconnects)
    syncUnreadState() {
      // Get all channels that have unread messages
      const channelsWithUnread = Object.keys(this.unreadByChannel).filter(
        (channelId) => (this.unreadByChannel[channelId]?.size || 0) > 0
      );

      // For each channel with unread, ensure we're in the room
      channelsWithUnread.forEach((channelId) => {
        const roomName = `channel_${channelId}`;
        this.ensureRoomJoined(roomName);
      });
    },

    // Force refresh unread counts (useful after reconnecting)
    forceRefreshUnreadCounts() {
      // Trigger reactivity update for all channels
      Object.keys(this.unreadByChannel).forEach((channelId) => {
        const count = this.getUnreadCount(channelId);
      });
    },
  },
});
