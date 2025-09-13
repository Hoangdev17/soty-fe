import { useCommunityStore } from "./community.store";
import type {
  Community,
  CommunityMember,
  CreateCommunityData,
} from "./community.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

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
    const communityStore = useCommunityStore();
    const toast = useToast();

    const existingMember = communityStore.currentCommunityMembers.find(
      (member) => member.communityId === communityId
    );

    if (existingMember) {
      throw new Error("You are already a member of this community.");
    }

    try {
      const response = await fetchWithAuth<CommunityMember>(
        `/community/${communityId}/join`,
        {
          method: "POST",
        }
      );

      communityStore.currentCommunityMembers.push(response);

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
