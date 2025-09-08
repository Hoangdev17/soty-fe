import { useAuthStore } from "~/stores/auth/auth.store";

export const useAuthGuard = () => {
  const authStore = useAuthStore();

  // Đợi auth khởi tạo xong
  const waitForAuth = async (): Promise<void> => {
    return new Promise((resolve) => {
      if (authStore.isAuthReady) {
        resolve();
        return;
      }

      // Watch cho đến khi auth ready
      const unwatch = watch(
        () => authStore.isAuthReady,
        (isReady) => {
          if (isReady) {
            unwatch();
            resolve();
          }
        },
        { immediate: true }
      );
    });
  };

  return {
    isLoading: computed(() => authStore.isLoading),
    isInitialized: computed(() => authStore.isInitialized),
    isAuthReady: computed(() => authStore.isAuthReady),
    waitForAuth,
  };
};
