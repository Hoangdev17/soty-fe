import { useAuthStore } from "~/stores/auth/auth.store";

// ⚡ TỐI ƯU: Plugin để khởi tạo auth sớm nhưng không block
export default defineNuxtPlugin(async () => {
  // Chỉ chạy ở client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Khởi tạo auth trong background, không block app load
  nextTick(async () => {
    try {
      await authStore.initializeAuth();
    } catch (error) {
      console.error("Auth initialization failed:", error);
    }
  });
});
