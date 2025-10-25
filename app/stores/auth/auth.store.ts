import { defineStore } from "pinia";
import type { Decorations, getRequestSentPayload, User } from "./auth.type";
import { authActions } from "./auth.action";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { initializeSocketIO } from "~/stores/websocket/websocket.action";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    decoration: [] as Decorations[],
    userDecoration: [] as Decorations[],
    profileDecoration: [] as Decorations[],
    nameTagDecoration: [] as Decorations[],
    friends: [] as User[] | null,
    friendRequest: [] as getRequestSentPayload[] | null,
    friendRequestSent: [] as getRequestSentPayload[] | null,
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
          } catch (e) {
            localStorage.removeItem("userData");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            this.logout();
          }
        } else if (token) {
          await this.verifyToken(token);
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
        throw error;
      }
    },
  },
});
