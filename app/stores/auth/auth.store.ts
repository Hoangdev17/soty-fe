import { defineStore } from "pinia";
import type { User } from "./auth.type";
import { authActions } from "./auth.action";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
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

    // Khởi tạo auth state từ localStorage (Fast mode)
    async initializeAuth() {
      if (this.isInitialized) {
        console.log("🔐 Auth already initialized, skipping...");
        return;
      }

      // Chỉ chạy ở client side
      if (typeof window === "undefined") {
        console.log("🔐 Server side, skipping auth init...");
        return;
      }

      this.isLoading = true;
      console.log("🔐 Starting auth initialization...");

      try {
        const token = localStorage.getItem("accessToken");
        const userDataString = localStorage.getItem("userData");

        if (token && userDataString) {
          console.log("🔐 Found cached user data, restoring...");
          try {
            const userData = JSON.parse(userDataString);
            this.user = userData;
            this.token = token;
            console.log("🔐 User restored from cache:", userData.username);

            // Verify token trong background (không block UI)
            this.verifyTokenInBackground();
          } catch (e) {
            console.log("🔐 Invalid cached data, clearing...");
            localStorage.removeItem("userData");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        } else if (token) {
          console.log("🔐 Found token but no cached user, verifying...");
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
        console.log("🔐 Auth initialization completed");
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
      console.log("🔐 Token verified, user:", user.username);
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
