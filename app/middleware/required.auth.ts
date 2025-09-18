import { navigateTo } from "#app";
import { useAuthStore } from "~/stores/auth/auth.store";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Đợi initializeAuth xong
  if (!authStore.isInitialized) {
    await authStore.initializeAuth();
  }

  // Check if user is authenticated in store (this handles expired tokens)
  if (!authStore.isLoggedIn) {
    // Allow access to auth pages and home
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

  // Prevent authenticated users from accessing auth pages
  if (
    to.path === "/auth/login" ||
    to.path === "/auth/register" ||
    to.path === "/auth/forgot-password"
  ) {
    return navigateTo("/@me/channels");
  }
});
