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
        }
      } catch (error) {
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

    // Check if token is expired
    isTokenExpired(token: string | null): boolean {
      if (!token) return true;

      try {
        // JWT has 3 parts separated by '.'
        const parts = token.split(".");
        if (parts.length !== 3 || !parts[1]) return true;

        // Decode payload (second part)
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        // Check if token has exp claim and if it's expired
        return payload.exp && payload.exp < currentTime;
      } catch (error) {
        return true;
      }
    },

    // Verify token trong background
    async verifyTokenInBackground() {
      // Check if token is expired before making request
      if (this.isTokenExpired(this.token)) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const { fetchWithAuth } = useFetchWithAuth();
            // This will trigger the refresh logic in useFetchWithAuth
            await fetchWithAuth<User>("/auth/me");
            return;
          } catch (refreshError) {
            await this.logout();
            return;
          }
        } else {
          await this.logout();
          return;
        }
      }

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
      } catch (error) {
        // Try to refresh token first
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const { fetchWithAuth } = useFetchWithAuth();
            // This will trigger the refresh logic in useFetchWithAuth
            await fetchWithAuth<User>("/auth/me");

            return;
          } catch (refreshError) {}
        }

        // If refresh failed or no refresh token, logout
        await this.logout();
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

    // Logout and redirect to login
    async logout() {
      this.clearAuthData();
      this.isInitialized = false;
      this.isLoading = false;

      // Disconnect WebSocket
      if (typeof window !== "undefined") {
        const { disconnectSocketIO } = await import(
          "~/stores/websocket/websocket.action"
        );
        disconnectSocketIO();
      }

      // Redirect to login if on client side
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/auth/login"
      ) {
        window.location.href = "/auth/login";
      }
    },

    // Update user profile
    async updateUserProfile(updates: Partial<User>) {
      const { fetchWithAuth } = useFetchWithAuth();

      try {
        const updatedUser = await fetchWithAuth<User>("/users", {
          method: "PATCH",
          body: JSON.stringify(updates),
        });

        // Update store
        this.user = updatedUser;

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("userData", JSON.stringify(updatedUser));
        }

        return updatedUser;
      } catch (error) {
        console.error("Failed to update user profile:", error);
        throw error;
      }
    },
  },
});
