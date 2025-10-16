export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    const { useAuthStore } = await import("~/stores/auth/auth.store");
    const authStore = useAuthStore();

    // Make store available globally for debugging
    (window as any).authStore = authStore;

    // Khởi tạo auth state ngay lập tức (sync nếu có cache)
    const startTime = performance.now();

    authStore
      .initializeAuth()
      .then(() => {
        const endTime = performance.now();
      })
      .catch((error) => {
      });
  }
});
