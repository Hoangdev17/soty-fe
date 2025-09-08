import { useAuthStore } from "~/stores/auth/auth.store";

export const useAuth = () => {
  const authStore = useAuthStore();

  // Đảm bảo auth được khởi tạo
  const ensureAuthInitialized = async () => {
    if (!authStore.isInitialized && import.meta.client) {
      await authStore.initializeAuth();
    }
  };

  return {
    user: computed(() => authStore.userInfo),
    isLoggedIn: computed(() => authStore.isLoggedIn),
    isInitialized: computed(() => authStore.isInitialized),
    isLoading: computed(() => authStore.isLoading),
    isAuthReady: computed(() => authStore.isAuthReady),
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    ensureAuthInitialized,
  };
};
