import { defineStore } from "pinia";
import type { User } from "./auth.type";
import { authActions } from "./auth.action";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { initializeSocketIO } from "~/stores/websocket/websocket.action";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userInfo: (state) => state.user,
    isAuthReady: (state) => state.isInitialized && !state.isLoading,
  },

  actions: {
    ...authActions,

    // Khởi tạo auth state từ localStorage (Fast mode) - Tối ưu performance
    async initializeAuth() {
      if (this.isInitialized) {
        return;
      }

      // Chỉ chạy ở client side
      if (typeof window === "undefined") {
        return;
      }

      this.isLoading = true;

      try {
        const token = localStorage.getItem("accessToken");
        const userDataString = localStorage.getItem("userData");

        if (token && userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            this.user = userData;
            this.token = token;

            // ⚡ TỐI ƯU: Chỉ verify token sau 5 phút hoặc khi cần thiết
            const lastVerified = localStorage.getItem("lastTokenVerify");
            const now = Date.now();
            if (!lastVerified || now - parseInt(lastVerified) > 5 * 60 * 1000) {
              this.verifyTokenInBackground();
            }
          } catch (e) {
            localStorage.removeItem("userData");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        } else if (token) {
          await this.verifyToken(token);
        } else {
          console.log("🔐 No token found in localStorage");
        }
      } catch (error) {
        console.log("🔐 Auth initialization failed:", error);
        this.clearAuthData();
      } finally {
        this.isLoading = false;
        this.isInitialized = true;

        // Initialize WebSocket if user is logged in
        if (this.user && this.token) {
          initializeSocketIO();
        }
      }
    },

    // Verify token trong background
    async verifyTokenInBackground() {
      try {
        const { fetchWithAuth } = useFetchWithAuth();
        const user = await fetchWithAuth<User>("/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        // Update user nếu có thay đổi
        if (JSON.stringify(user) !== JSON.stringify(this.user)) {
          this.user = user;
          localStorage.setItem("userData", JSON.stringify(user));
        }
        console.log("🔐 Background token verification successful");
      } catch (error) {
        console.log("🔐 Background token verification failed, logging out...");
        this.clearAuthData();
      }
    },

    // Verify token immediately (blocking)
    async verifyToken(token: string) {
      const { fetchWithAuth } = useFetchWithAuth();
      const user = await fetchWithAuth<User>("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.user = user;
      this.token = token;

      // Cache user data
      localStorage.setItem("userData", JSON.stringify(user));
    },

    // Clear all auth data
    clearAuthData() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    },
  },
});
