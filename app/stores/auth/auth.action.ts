import type { User } from "./auth.type";
import { useAuthStore } from "./auth.store";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import {
  initializeSocketIO,
  disconnectSocketIO,
} from "~/stores/websocket/websocket.action";

export const authActions = {
  // Legacy method - giữ để backward compatibility
  async initAuth() {
    const store = useAuthStore();
    await store.initializeAuth();
  },

  async setUser(user: User | null, token: string | null) {
    const store = useAuthStore();

    store.user = user;
    store.token = token;
  },

  async login(email: string, password: string) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    try {
      const res = await fetchWithAuth<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Cập nhật store
      store.user = res.user;
      store.token = res.accessToken;

      // Lưu token và user data vào localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        localStorage.setItem("userData", JSON.stringify(res.user));
      }

      // Đánh dấu đã khởi tạo
      store.isInitialized = true;

      // Initialize WebSocket connection
      initializeSocketIO();

      return res;
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    }
  },

  async register(email: string, username: string, password: string) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    try {
      const res = await fetchWithAuth<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, passwordHash: password }),
      });

      // Cập nhật store
      store.user = res.user;
      store.token = res.accessToken;

      // Lưu token và user data vào localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        localStorage.setItem("userData", JSON.stringify(res.user));
      }

      // Đánh dấu đã khởi tạo
      store.isInitialized = true;

      // Initialize WebSocket connection
      initializeSocketIO();

      return res;
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    }
  },

  async logout() {
    const store = useAuthStore();
    store.clearAuthData();
    store.isInitialized = false;
    store.isLoading = false;

    // Disconnect WebSocket
    disconnectSocketIO();
  },
};
