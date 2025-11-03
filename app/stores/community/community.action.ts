import { useMemberStore } from "../member/member.store";
import type { Member } from "../member/member.type";
import { useCommunityStore } from "./community.store";
import type {
  Community,
  CommunityMember,
  CreateCommunityData,
  CreateEventPayload,
  GuildEmoji,
  GuildEvent,
  GuildSticker,
  joinRequest,
  TenorEmojiResult,
} from "./community.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import {
  joinRoom,
  leaveRoom,
  ensureRoomJoined,
} from "../websocket/websocket.action";
import { useChannelStore } from "../channels/channel.store";
import { useMessageStore } from "../message/message.store";
import { useAuthStore } from "../auth/auth.store";
import { useRoleStore } from "../roles/role.store";
import { useWebSocketStore } from "../websocket/websocket.store";
import { useRoute } from "vue-router";
import { navigateTo } from "#app";

export const communityActions = {
  async fetchAllCommunity() {
    const { fetchWithAuth } = useFetchWithAuth();
    const commnityStore = useCommunityStore();

    const response = await fetchWithAuth<Community[]>(`/community`, {
      method: "GET",
    });

    commnityStore.communitiesAll = response;
    return response;
  },

  // Lấy danh sách communities
  async fetchCommunities() {
    const { fetchWithAuth } = useFetchWithAuth();

    const communities = await fetchWithAuth<Community[]>("/community/me", {
      method: "GET",
    });

    const communityStore = useCommunityStore();
    communityStore.communities = communities;

    return communities;
  },

  // Lấy chi tiết community
  async fetchCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();
    const memberStore = useMemberStore();
    const channelStore = useChannelStore();
    const messageStore = useMessageStore();
    const roleStore = useRoleStore();
    // Reset all stores when switching communities
    memberStore.clearAllMembers();
    channelStore.clearChannels();
    messageStore.clearAllMessages();

    const community = await fetchWithAuth<Community>(
      `/communities/${communityId}`,
      {
        method: "GET",
      }
    );

    communityStore.currentCommunity = community;
    roleStore.roles[communityId] = community.roles || [];
    channelStore.channels = community.channels;

    joinRoom(`community_${communityId}`);

    return community;
  },

  // Tạo community mới
  async createCommunity(data: CreateCommunityData) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const newCommunity = await fetchWithAuth<Community>("/community", {
      method: "POST",
      body: JSON.stringify(data),
    });

    communityStore.communities.push(newCommunity);
    communityStore.currentCommunity = newCommunity;

    joinRoom(`community_${newCommunity.id}`);

    navigateTo("/community/introduce/" + newCommunity.id);

    return newCommunity;
  },

  async fetchCommunityById(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();
    const channelStore = useChannelStore();
    const memberStore = useMemberStore();
    const roleStore = useRoleStore();

    const community = await fetchWithAuth<Community>(
      `/community/${communityId}`,
      {
        method: "GET",
      }
    );

    communityStore.currentCommunity = community;
    channelStore.channels = community.channels;
    roleStore.roles[communityId] = community.roles || [];
    memberStore.memberCount = community.memberCount;

    joinRoom(`community_${communityId}`);

    return community;
  },

  // Update community
  async updateCommunity(
    communityId: string,
    data: Partial<CreateCommunityData>
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const updatedCommunity = await fetchWithAuth<Community>(
      `/community/${communityId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );

    // Update current community if it's the one being updated
    if (communityStore.currentCommunity?.id === communityId) {
      communityStore.currentCommunity = updatedCommunity;
    }

    return updatedCommunity;
  },

  // Join community
  async joinCommunity(communityId: string) {
    const authStore = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    const toast = useToast();

    try {
      const response = await fetchWithAuth<Member>(
        `/community/${communityId}/join`,
        { method: "POST" }
      );

      if (response.statusCode === 202) {
        toast.add({
          title: "Request Sent",
          description:
            "Your request to join this community is pending approval.",
          color: "info",
          duration: 5000,
        });
      }

      const memberStore = useMemberStore();
      try {
        await memberStore.addMember(communityId, response);
      } catch (err) {}

      // Refresh members in background to guarantee consistency with server
      memberStore.fetchMembers(communityId).catch(() => {
        // swallow errors — UI already updated optimistically
      });

      return response;
    } catch (error) {
      toast.add({
        title: "Failed to join",
        description: "You are already a member of this community.",
        color: "error",
        duration: 5000,
      });
    }
  },

  // Leave community (member)
  async leaveCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();
    const channelStore = useChannelStore();
    const messageStore = useMessageStore();
    const wsStore = useWebSocketStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/communities/${communityId}/leave`,
      {
        method: "POST",
      }
    );

    // Remove community from local store
    const communityStore = useCommunityStore();
    communityStore.removeCommunity(communityId);

    // Clear all related data
    memberStore.clearAllMembers();
    channelStore.clearChannels();
    messageStore.clearAllMessages();

    // Clear WebSocket unread data for this community
    wsStore.clearUnreadCache(communityId);

    // Clear community-channel mappings and leave WebSocket rooms
    Object.keys(wsStore.channelToCommunity).forEach((channelId) => {
      if (wsStore.channelToCommunity[channelId] === communityId) {
        delete wsStore.channelToCommunity[channelId];
        wsStore.clearUnread(channelId);
        // Leave WebSocket room for this channel
        leaveRoom(`channel_${channelId}`);
      }
    });

    // Leave community room if exists
    leaveRoom(`community_${communityId}`);

    return response;
  },

  // Delete community (owner only)
  async deleteCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();
    const channelStore = useChannelStore();
    const messageStore = useMessageStore();
    const wsStore = useWebSocketStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/community/${communityId}`,
      {
        method: "DELETE",
      }
    );

    // Remove community from local store
    const communityStore = useCommunityStore();
    communityStore.removeCommunity(communityId);

    // Clear all related data
    memberStore.clearAllMembers();
    channelStore.clearChannels();
    messageStore.clearAllMessages();

    // Clear WebSocket unread data for this community
    wsStore.clearUnreadCache(communityId);

    // Clear community-channel mappings and leave WebSocket rooms
    Object.keys(wsStore.channelToCommunity).forEach((channelId) => {
      if (wsStore.channelToCommunity[channelId] === communityId) {
        delete wsStore.channelToCommunity[channelId];
        wsStore.clearUnread(channelId);
        // Leave WebSocket room for this channel
        leaveRoom(`channel_${channelId}`);
      }
    });

    // Leave community room if exists
    leaveRoom(`community_${communityId}`);

    return response;
  },

  // Kick member from community
  async kickMember(communityId: string, memberId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/community/${communityId}/members/${memberId}/kick`,
      {
        method: "DELETE",
      }
    );

    // Remove member from local store
    memberStore.removeMember(communityId, memberId);

    return response;
  },

  // Ban member from community
  async banMember(communityId: string, memberId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/community/${communityId}/members/${memberId}/ban`,
      {
        method: "DELETE",
      }
    );

    // Remove member from local store
    memberStore.removeMember(communityId, memberId);

    return response;
  },

  async createEvent(communityId: string, data: CreateEventPayload) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const res = await fetchWithAuth<GuildEvent>(
      `/communities/${communityId}/events`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    communityStore.currentCommunity?.events?.push(res);
    return res;
  },

  async fetchAllEvent(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const events = await fetchWithAuth<GuildEvent[]>(
      `/communities/${communityId}/events`,
      {
        method: "GET",
      }
    );

    if (communityStore.currentCommunity?.id === communityId) {
      communityStore.currentCommunity.events = events;
    }

    return events;
  },

  async fetchJoinRequests(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const requests = await fetchWithAuth<joinRequest[]>(
      `/community/${communityId}/join-requests`,
      {
        method: "GET",
      }
    );

    communityStore.joinRequests = requests;
    return requests;
  },

  async approveJoinRequest(communityId: string, requestId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();
    const memberStore = useMemberStore();

    const request = await fetchWithAuth<joinRequest>(
      `/community/${communityId}/join-requests/${requestId}/approve`,
      {
        method: "POST",
      }
    );

    communityStore.joinRequests =
      communityStore.joinRequests?.filter((req) => req.id !== requestId) ||
      null;

    memberStore.addMember(communityId, {
      id: request.id,
      userId: request.userId,
      guildId: communityId,
      joinedAt: new Date(request.createdAt),
      flags: [],
      permissions: [],
      bannable: false,
      kickable: false,
      manageable: false,
      moderatable: false,
      pending: false,
      xp: 0,
      coins: 0,
      xepo: 0,
      currentLevel: 0,
      dailyStreak: 0,
      user: {
        ...request.user,
        presence: null,
      },
    });

    return request;
  },

  async rejectJoinRequest(communityId: string, requestId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const request = await fetchWithAuth<joinRequest>(
      `/community/${communityId}/join-requests/${requestId}/reject`,
      {
        method: "POST",
      }
    );

    communityStore.joinRequests =
      communityStore.joinRequests?.filter((req) => req.id !== requestId) ||
      null;

    return request;
  },

  async searchStickersByTenor(
    q: string,
    limit: number = 20,
    guildId: string,
    type: "gif" | "sticker" | "emoji" | "all" = "sticker"
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<TenorEmojiResult>(
      `/guilds/${guildId}/stickers/search?q=${q}&limit=${limit}&type=${type}`,
      {
        method: "GET",
      }
    );

    return response;
  },

  async fetchCommunityStickers(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<GuildSticker[]>(
      `/guilds/${communityId}/stickers`,
      {
        method: "GET",
      }
    );

    communityStore.GuildStickers.push(...response);

    return response;
  },

  async createCommunitySticker(
    communityId: string,
    dto: {
      name: string;
      description?: string;
      tags?: string;
      url: string;
      format: number;
      type: number;
      packId?: string;
    }
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<GuildSticker>(
      `/guilds/${communityId}/stickers`,
      {
        method: "POST",
        body: JSON.stringify(dto),
      }
    );

    communityStore.GuildStickers.push(response);

    return response;
  },

  async deleteCommunitySticker(communityId: string, stickerId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/guilds/${communityId}/stickers/${stickerId}`,
      {
        method: "DELETE",
      }
    );

    communityStore.GuildStickers = communityStore.GuildStickers.filter(
      (sticker) => sticker.id !== stickerId
    );

    return response;
  },

  async getEmojisByTenor(q: string, limit: number = 20, guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<TenorEmojiResult>(
      `/guilds/${guildId}/emojis/search?q=${q}&limit=${limit}`,
      {
        method: "GET",
      }
    );

    communityStore.GuildEmojis.push(...response.results);

    return response.results;
  },

  async fetchCommunityEmojis(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<GuildEmoji[]>(
      `/guilds/${communityId}/emojis`,
      {
        method: "GET",
      }
    );

    communityStore.GuildEmojis.push(...response);

    return response;
  },

  async createCommunityEmoji(
    communityId: string,
    dto: {
      name: string;
      url: string;
      animated?: boolean;
    }
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<GuildEmoji>(
      `/guilds/${communityId}/emojis`,
      {
        method: "POST",
        body: JSON.stringify(dto),
      }
    );

    communityStore.GuildEmojis.push(response);

    return response;
  },

  async deleteCommunityEmoji(communityId: string, emojiId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/guilds/${communityId}/emojis/${emojiId}`,
      {
        method: "DELETE",
      }
    );

    communityStore.GuildEmojis = communityStore.GuildEmojis.filter(
      (emoji) => emoji.id !== emojiId
    );

    return response;
  },
};
