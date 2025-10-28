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
    }
  };

  // Get cached unread count (fast, may be stale)
  const getCachedChannelUnreadCount = (channelId: string): number => {
    // Always fetch from backend, no cache
    return 0; // Return 0 as placeholder, use refreshChannelUnreadCount instead
  };

  const getCachedCommunityUnreadCount = (communityId: string): number => {
    // Always fetch from backend, no cache
    return 0; // Return 0 as placeholder, use refreshCommunityUnreadCount instead
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
