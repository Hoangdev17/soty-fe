import { useAuthStore } from "~/stores/auth/auth.store";

interface FetchOptions extends RequestInit {
  query?: Record<string, string | number>;
  isFormData?: boolean;
}

export function useFetchWithAuth() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const baseUrl =
    config.public.NUXT_PUBLIC_API_BASE_URL || config.public.apiBase;

  async function fetchWithAuth<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const headers: HeadersInit = {
        ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      };

      if (authStore.token) {
        (headers as any)["Authorization"] = `Bearer ${authStore.token}`;
      }

      // build query string nếu có
      let fullUrl = `${baseUrl}${url}`;
      if (options.query) {
        const params = new URLSearchParams(
          Object.entries(options.query).map(([k, v]) => [k, v.toString()])
        );
        fullUrl += `?${params.toString()}`;
      }

      const res = await fetch(fullUrl, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Nếu 401 → refresh token rồi thử lại
        if (res.status === 401) {
          const refreshed = await handleRefreshToken();
          if (refreshed) {
            return makeRequest(); // retry sau khi refresh
          }
        }

        // Ném lỗi chi tiết (status, body)
        throw {
          status: res.status,
          statusText: res.statusText,
          body: data,
        };
      }

      return data as T;
    };

    return makeRequest();
  }

  async function handleRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        authStore.logout();
        return false;
      }

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        authStore.logout();
        return false;
      }

      const data = await res.json();

      authStore.token = data.accessToken;
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch (error) {
      console.log("🔄 Refresh token error:", error);
      authStore.logout();
      return false;
    }
  }

  return { fetchWithAuth, handleRefreshToken };
}
