import { defineStore } from "pinia";
import type {
  Community,
  CommunityMember,
  GuildEmoji,
  GuildSticker,
  joinRequest,
} from "./community.type";
import { communityActions } from "./community.action";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    communities: [] as Community[], //communitys of the user
    communitiesAll: [] as Community[], //all communitys
    currentCommunity: null as Community | null,
    currentCommunityMembers: [] as CommunityMember[],
    joinRequests: null as joinRequest[] | null,
    GuildStickers: [] as GuildSticker[],
    GuildEmojis: [] as GuildEmoji[],
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

    async removeCommunity(communityId: string) {
      this.communities = this.communities.filter(
        (community) => community.id !== communityId
      );
      if (this.currentCommunity?.id === communityId) {
        this.currentCommunity = null;
        this.currentCommunityMembers = [];
      }
    },
  },
});
