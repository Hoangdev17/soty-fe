import { navigateTo } from "#app";
import { useAuthStore } from "~/stores/auth/auth.store";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    if (
      to.path === "/auth/login" ||
      to.path === "/auth/register" ||
      to.path === "/auth/forgot-password" ||
      to.path === "/"
    ) {
      return;
    }
    return navigateTo("/auth/login");
  }

  if (
    to.path === "/auth/login" ||
    to.path === "/auth/register" ||
    to.path === "/auth/forgot-password" ||
    to.path === "/"
  ) {
    return;
  }

  const authStore = useAuthStore();

  // Đợi initializeAuth xong
  if (!authStore.isInitialized) {
    await authStore.initializeAuth();
  }

  // Nếu chưa login → chặn navigation ngay lập tức
  if (!authStore.isLoggedIn && to.path !== "/auth/login") {
    return navigateTo("/auth/login");
  }
});
