import { useAuthStore } from "~/stores/auth/auth.store";
import { useCommunityStore } from "~/stores/community/community.store";

// ⚡ TỐI ƯU: Plugin để khởi tạo auth sớm nhưng không block
export default defineNuxtPlugin(async () => {
  // Chỉ chạy ở client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Khởi tạo auth trong background, không block app load
  nextTick(async () => {
    try {
      await authStore.initializeAuth();

      // Sau khi auth xong, khởi tạo unread state cho communities
      if (authStore.isAuthenticated) {
        try {
          const { useUnreadManager } = await import(
            "~/composables/useUnreadManager"
          );
          const { initializeUnreadForCommunities } = useUnreadManager();

          // Get user's communities
          const communityStore = useCommunityStore();
          const communities = await communityStore.fetchCommunities();
          const communityIds = communities.map((c) => c.id);

          // Initialize unread state for all communities once
          if (communityIds.length > 0) {
            await initializeUnreadForCommunities(communityIds);
          }
        } catch (unreadError) {
        }
      }
    } catch (error) {
    }
  });
});
