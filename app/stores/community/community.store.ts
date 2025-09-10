import { defineStore } from "pinia";
import type {
  Community,
  CommunityMember,
  CreateCommunityData,
  CommunityFilters,
} from "./community.type";
import { communityActions } from "./community.action";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    communities: [] as Community[],
    currentCommunity: null as Community | null,
    currentCommunityMembers: [] as CommunityMember[],

    // Track joined communities (vì BE không trả về isJoined)
    joinedCommunityIds: [] as string[],

    // Loading states
    isLoading: false,
    isLoadingCommunities: false,
    isLoadingCurrentCommunity: false,
    isLoadingMembers: false,

    // Pagination
    totalCommunities: 0,
    currentPage: 1,
    hasMore: true,
    // Cache
    lastFetchTime: 0,
    cacheExpiry: 5 * 60 * 1000, // 5 phút
  }),

  actions: {
    ...communityActions,
  },
});
