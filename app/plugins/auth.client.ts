export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    console.log("🔐 Auth plugin loading...");

    const { useAuthStore } = await import("~/stores/auth/auth.store");
    const authStore = useAuthStore();

    console.log(
      "🔐 Auth store created, isInitialized:",
      authStore.isInitialized
    );

    // Make store available globally for debugging
    (window as any).authStore = authStore;
    console.log("🔐 AuthStore available globally as window.authStore");

    // Khởi tạo auth state ngay lập tức (sync nếu có cache)
    const startTime = performance.now();

    authStore
      .initializeAuth()
      .then(() => {
        const endTime = performance.now();
        console.log(
          `🔐 Auth initialized successfully in ${Math.round(
            endTime - startTime
          )}ms, user:`,
          authStore.user?.username || "none"
        );
      })
      .catch((error) => {
        console.error("🔐 Failed to initialize auth:", error);
      });
  }
});
