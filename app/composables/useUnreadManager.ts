import { computed, ref } from "vue";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useAuthStore } from "~/stores/auth/auth.store";

export const useUnreadManager = () => {
  const wsStore = useWebSocketStore();
  const authStore = useAuthStore();

  // Reactive computed for unread counts
  const getChannelUnreadCount = (channelId: string) => {
    return computed(() => wsStore.getUnreadCount(channelId));
  };

  const getCommunityUnreadCount = (communityId: string) => {
    return computed(() => wsStore.getUnreadCountForCommunity(communityId));
  };

  // Initialize unread state for communities (call once per session)
  const initializeUnreadForCommunities = async (communityIds: string[]) => {
    await wsStore.initializeUnreadState(communityIds);
  };

  // Mark channel as read with optimized flow
  const markChannelAsRead = async (
    channelId: string,
    lastMessageId?: string
  ) => {
    if (!channelId) return;

    // Get the latest message ID if not provided
    const messageId =
      lastMessageId || wsStore.getLastReadMessageId(channelId) || "";

    if (messageId) {
      await wsStore.sendReadReceipt(channelId, messageId);
    } else {
      console.warn("No message ID available for read receipt");
    }
  };

  // Get cached unread count (fast, may be stale)
  const getCachedChannelUnreadCount = (channelId: string): number => {
    const cache = wsStore.unreadCacheByChannel[channelId];
    if (cache && Date.now() - cache.lastFetched < 30000) {
      // 30s cache
      return cache.count;
    }
    return wsStore.getUnreadCount(channelId); // Fallback to local state
  };

  const getCachedCommunityUnreadCount = (communityId: string): number => {
    const cache = wsStore.unreadCacheByCommunity[communityId];
    if (cache && Date.now() - cache.lastFetched < 30000) {
      // 30s cache
      return cache.count;
    }
    return wsStore.getCommunityUnreadCount(communityId); // Fallback to local state
  };

  // Force refresh unread count (bypasses cache)
  const refreshChannelUnreadCount = async (channelId: string) => {
    return await wsStore.fetchChannelUnreadCount(channelId, true);
  };

  const refreshCommunityUnreadCount = async (communityId: string) => {
    return await wsStore.fetchCommunityUnreadCount(communityId, true);
  };

  // Join user room for DM notifications
  const joinUserRoom = () => {
    if (authStore.user?.id) {
      const userRoom = `user_${authStore.user.id}`;
      wsStore.ensureRoomJoined(userRoom);
    }
  };

  // Clean up cache
  const clearUnreadCache = (target?: string) => {
    wsStore.clearUnreadCache(target);
  };

  return {
    // Reactive getters
    getChannelUnreadCount,
    getCommunityUnreadCount,

    // Cached getters (fast)
    getCachedChannelUnreadCount,
    getCachedCommunityUnreadCount,

    // Actions
    initializeUnreadForCommunities,
    markChannelAsRead,
    refreshChannelUnreadCount,
    refreshCommunityUnreadCount,
    joinUserRoom,
    clearUnreadCache,
  };
};
