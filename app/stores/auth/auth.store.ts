import { defineStore } from "pinia";
import type { User } from "./auth.type";
import { authActions } from "./auth.action";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
  }),

  actions: {
    ...authActions,
  },
});
