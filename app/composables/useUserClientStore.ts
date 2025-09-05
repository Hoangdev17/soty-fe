import { onMounted } from "vue";
import type { User } from "~/stores/auth/auth.type";

export function useUserClientStore() {
  const user = useState<User | null>("userClient_user", () => null);
  const token = useState<string | null>("userClient_token", () => null);

  onMounted(() => {
    const savedUser = localStorage.getItem("userClient_user");
    const savedToken = localStorage.getItem("userClient_token");

    if (savedUser) user.value = JSON.parse(savedUser);
    if (savedToken) token.value = savedToken;

    console.log("User loaded from localStorage:", user.value);
  });

  const setUser = (userData: User, jwt: string) => {
    user.value = userData;
    token.value = jwt;

    if (process.client) {
      localStorage.setItem("userClient_user", JSON.stringify(userData));
      localStorage.setItem("userClient_token", jwt);
    }
  };

  const clearUser = () => {
    user.value = null;
    token.value = null;
    if (process.client) {
      localStorage.removeItem("userClient_user");
      localStorage.removeItem("userClient_token");
    }
  };

  return { user, token, setUser, clearUser };
}
