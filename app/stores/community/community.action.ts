import { useCommunityStore } from "./community.store";
import type {
  Community,
  CommunityMember,
  CreateCommunityData,
  CommunityFilters,
} from "./community.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { joinRoom } from "~/stores/websocket/websocket.action";

export const communityActions = {
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
    return await fetchWithAuth<Community>(`/communities/${communityId}`, {
      method: "GET",
    });
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

    return newCommunity;
  },

  async fetchCommunityById(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const communityStore = useCommunityStore();

    const community = await fetchWithAuth<Community>(
      `/community/${communityId}`,
      {
        method: "GET",
      }
    );

    communityStore.currentCommunity = community;

    return community;
  },

  // Update community
  async updateCommunity(
    communityId: string,
    data: Partial<CreateCommunityData>
  ) {
    const { fetchWithAuth } = useFetchWithAuth();

    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.avatar) formData.append("avatar", data.avatar);
    if (data.banner) formData.append("banner", data.banner);

    return await fetchWithAuth<Community>(`/communities/${communityId}`, {
      method: "PUT",
      body: formData,
    });
  },

  // Join community
  async joinCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    return await fetchWithAuth<{ message: string }>(
      `/communities/${communityId}/join`,
      {
        method: "POST",
      }
    );
  },

  // Leave community
  async leaveCommunity(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    return await fetchWithAuth<{ message: string }>(
      `/communities/${communityId}/leave`,
      {
        method: "POST",
      }
    );
  },

  // Lấy danh sách members
  async fetchCommunityMembers(communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    return await fetchWithAuth<CommunityMember[]>(
      `/communities/${communityId}/members`,
      {
        method: "GET",
      }
    );
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
