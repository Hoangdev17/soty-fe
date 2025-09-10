import { navigateTo } from "#app";
import { useAuthStore } from "~/stores/auth/auth.store";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // ⚡ TỐI ƯU: Chỉ chạy ở client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // ⚡ TỐI ƯU: Không block render, chỉ khởi tạo nếu chưa có data
  if (!authStore.isInitialized) {
    // Khởi tạo không đồng bộ, không block
    authStore.initializeAuth().catch(console.error);
  }

  // ⚡ TỐI ƯU: Kiểm tra nhanh từ cache trước
  if (!authStore.isLoggedIn) {
    // Nếu chưa login và đã initialized, redirect ngay
    if (authStore.isInitialized) {
      return navigateTo("/auth/login");
    }
    // Nếu chưa initialized, cho phép render và kiểm tra sau
  }
});
