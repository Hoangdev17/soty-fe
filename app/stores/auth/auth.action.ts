import type {
  Decorations,
  FriendPayload,
  getRequestSentPayload,
  getUserDecorationInterface,
  User,
} from "./auth.type";
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
    await store.logout();
  },

  async fetchAvatarDecorations(offset?: number, limit?: number) {
    const { fetchWithAuth } = useFetchWithAuth();
    const response = await fetchWithAuth<{
      decorator: Decorations[];
      limit: number;
      offset: number;
      total: number;
    }>(`/collectibles/getAll?assetType=1&offset=${offset}&limit=${limit}`, {
      method: "GET",
    });

    const store = useAuthStore();

    store.decoration.push(...response.decorator);

    return response.decorator;
  },

  async fetchAvatarDecorationById(id: string) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    if (!id) return null;

    // Try single-item endpoint first
    try {
      const single = await fetchWithAuth<Decorations>(`/collectibles/${id}`, {
        method: "GET",
      });

      const exists = store.decoration.some((d) => d.id === single.id);
      if (!exists) {
        store.decoration.push(single);
      }

      return single;
    } catch (e) {}
  },

  async fetchProfileDecorations(offset?: number, limit?: number) {
    const { fetchWithAuth } = useFetchWithAuth();
    const response = await fetchWithAuth<{
      decorator: Decorations[];
      limit: number;
      offset: number;
      total: number;
    }>(`/collectibles/getAll?assetType=2&offset=${offset}&limit=${limit}`, {
      method: "GET",
    });

    const store = useAuthStore();
    const uniqueDecorations = response.decorator.filter(
      (d) => !store.profileDecoration.some((existing) => existing.id === d.id)
    );

    store.profileDecoration.push(...uniqueDecorations);

    return response.decorator;
  },

  // Find one profile decoration by id (similar to avatar helper)
  async fetchProfileDecorationById(id: string) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    if (!id) return null;

    const existing = store.profileDecoration.find(
      (d: any) => String(d.id) === String(id)
    );
    if (existing) return existing;

    // Try direct endpoint
    try {
      const single = await fetchWithAuth<Decorations>(`/collectibles/${id}`, {
        method: "GET",
      });

      store.profileDecoration.push(single);
    } catch (e) {}
  },

  async fetchNameTagDecorations(offset?: number, limit?: number) {
    const { fetchWithAuth } = useFetchWithAuth();
    const response = await fetchWithAuth<{
      decorator: Decorations[];
      limit: number;
      offset: number;
      total: number;
    }>(`/collectibles/getAll?assetType=0&offset=${offset}&limit=${limit}`, {
      method: "GET",
    });

    const store = useAuthStore();
    store.nameTagDecoration = [];
    store.nameTagDecoration.push(...response.decorator);

    return response.decorator;
  },

  // Find one nametag decoration by id
  async fetchNameTagDecorationById(id: string) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    if (!id) return null;

    const existing = store.nameTagDecoration.find(
      (d: any) => String(d.id) === String(id)
    );
    if (existing) return existing;

    // Try direct endpoint
    try {
      const single = await fetchWithAuth<Decorations>(`/collectibles/${id}`, {
        method: "GET",
      });

      store.nameTagDecoration.push(single);
      return single;
    } catch (e) {
      console.error("Failed to fetch nametag decoration by ID:", e);
      return null;
    }
  },

  async fetchDecorationByUserId(type: number) {
    const store = useAuthStore();
    const { fetchWithAuth } = useFetchWithAuth();

    try {
      const decorations = await fetchWithAuth<getUserDecorationInterface>(
        `/collectibles/user/@me?assetType=${type}`,
        { method: "GET" }
      );

      const newDecorations = decorations.collectibles
        .map((c) => c.asset)
        .filter((asset) => asset.assetType === type);

      store.userDecoration = newDecorations;

      if (type === 1) {
        const unique = newDecorations.filter(
          (d) => !store.decoration.some((existing) => existing.id === d.id)
        );
        store.decoration.unshift(...unique);
      } else if (type === 2) {
        const unique = newDecorations.filter(
          (d) =>
            !store.profileDecoration.some((existing) => existing.id === d.id)
        );
        store.profileDecoration.unshift(...unique);
      } else if (type === 0) {
        const unique = newDecorations.filter(
          (d) =>
            !store.nameTagDecoration.some((existing) => existing.id === d.id)
        );
        store.nameTagDecoration.unshift(...unique);
      }

      return decorations;
    } catch (e) {
      console.error("Failed to fetch user decorations by user ID:", e);
      return null;
    }
  },

  async getUserFriendList() {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const friendList = await fetchWithAuth<FriendPayload[]>("/users/friends", {
      method: "GET",
    });

    authStore.friends = friendList.map((a) => a.friend);

    return friendList;
  },

  async getUserFriendRequestList() {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const requestList = await fetchWithAuth<getRequestSentPayload[]>(
      "/users/friends/requests",
      {
        method: "GET",
      }
    );

    authStore.friendRequest = requestList;

    return requestList;
  },

  async getUserFriendRequestListSent() {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const requestList = await fetchWithAuth<getRequestSentPayload[]>(
      "/users/friends/requests/me",
      {
        method: "GET",
      }
    );

    authStore.friendRequestSent = requestList;
  },

  async sendFriendRequest(receiverId: string) {
    const { fetchWithAuth } = useFetchWithAuth();

    const res = await fetchWithAuth("/users/friends/requests", {
      method: "POST",
      body: JSON.stringify({
        receiverId,
      }),
    });

    return res;
  },

  async acceptFriendRequest(requestId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const res = await fetchWithAuth(`/users/friends/request/${requestId}`, {
      method: "PATCH",
    });

    authStore.friendRequest =
      authStore.friendRequest?.filter((a) => a.id !== requestId) ?? [];

    authStore.friendRequestSent =
      authStore.friendRequestSent?.filter((a) => a.id !== requestId) ?? [];

    return res;
  },

  async rejectFriendRequest(requestId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const res = await fetchWithAuth(
      `/users/friends/request/${requestId}/reject`,
      {
        method: "PATCH",
      }
    );

    authStore.friendRequest =
      authStore.friendRequest?.filter((a) => a.id !== requestId) ?? [];

    authStore.friendRequestSent =
      authStore.friendRequestSent?.filter((a) => a.id !== requestId) ?? [];

    return res;
  },

  async deleteFriend(friendId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const res = await fetchWithAuth(`/users/friends/${friendId}`, {
      method: "DELETE",
    });

    authStore.friends =
      authStore.friends?.filter((a) => a.id !== friendId) ?? [];

    return res;
  },

  async removeFriendRequest(requestId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const authStore = useAuthStore();

    const res = await fetchWithAuth(`/users/friends/request/${requestId}`, {
      method: "DELETE",
    });

    authStore.friendRequestSent =
      authStore.friendRequestSent?.filter((a) => a.id !== requestId) ?? [];

    return res;
  },
};
