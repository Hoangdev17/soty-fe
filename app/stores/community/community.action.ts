import { useMemberStore } from "../member/member.store";
import type { Member } from "../member/member.type";
import { useCommunityStore } from "./community.store";
import type {
  Community,
  CommunityMember,
  CreateCommunityData,
} from "./community.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { joinRoom, leaveRoom } from "../websocket/websocket.action";
import { useChannelStore } from "../channels/channel.store";
import { useMessageStore } from "../message/message.store";
import { useAuthStore } from "../auth/auth.store";

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

    // Leave previous community room if exists
    if (communityStore.currentCommunity) {
      leaveRoom(`community_${communityStore.currentCommunity.id}`);
    }

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

    // Leave current community room if exists
    if (communityStore.currentCommunity) {
      leaveRoom(`community_${communityStore.currentCommunity.id}`);
    }

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

    // Leave previous community room if exists
    if (communityStore.currentCommunity) {
      leaveRoom(`community_${communityStore.currentCommunity.id}`);
    }

    const community = await fetchWithAuth<Community>(
      `/community/${communityId}`,
      {
        method: "GET",
      }
    );

    communityStore.currentCommunity = community;
    channelStore.channels = community.channels;

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
    const userId = authStore.user?.id;

    const { joinCommunity } = useWebSocket();
    const toast = useToast();

    try {
      joinRoom(`community_${communityId}`);

      // Use non-null assertion since userId is checked above
      return await joinCommunity(communityId, userId!);
    } catch (error) {
      toast.add({
        title: "Failed to join",
        description: "You are already a member of this community.",
        color: "error",
        duration: 5000,
      });
    }
  },

  // Leave community
  async leaveCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();
    const channelStore = useChannelStore();
    const messageStore = useMessageStore();

    const response = await fetchWithAuth<{ message: string }>(
      `/communities/${communityId}/leave`,
      {
        method: "POST",
      }
    );

    // Reset all stores when leaving community
    memberStore.clearAllMembers();
    channelStore.clearChannels();
    messageStore.clearAllMessages();

    leaveRoom(`community_${communityId}`);

    return response;
  },

  // Delete community (chỉ owner)
  async deleteCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    return await fetchWithAuth<{ message: string }>(
      `/communities/${communityId}`,
      {
        method: "DELETE",
      }
    );
  },
};
