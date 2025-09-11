import { useAuthStore } from "~/stores/auth/auth.store";

interface FetchOptions extends RequestInit {
  query?: Record<string, string | number>;
}

export function useFetchWithAuth() {
  const authStore = useAuthStore();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  async function fetchWithAuth<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (authStore.token) {
        (headers as any)["Authorization"] = `Bearer ${authStore.token}`;
      }

      let fullUrl = `${baseUrl}${url}`;
      if (options.query) {
        const params = new URLSearchParams(
          Object.entries(options.query).map(([k, v]) => [k, v.toString()])
        );
        fullUrl += `?${params.toString()}`;
      }

      const res = await fetch(fullUrl, { ...options, headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Nếu 401, thử refresh token
        if (res.status === 401) {
          const refreshed = await handleRefreshToken();
          if (refreshed) {
            return makeRequest(); // retry request sau khi refresh token
          }
        }
        throw new Error(data.message || `Error ${res.status}`);
      }
      return res.json();
    };

    return makeRequest();
  }

  async function handleRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      authStore.token = data.accessToken;
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  return { fetchWithAuth };
}
