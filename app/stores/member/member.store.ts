import { defineStore } from "pinia";
import type { Member, MemberState } from "./member.type";
import { memberActions } from "./member.action";

export const useMemberStore = defineStore("member", {
  state: (): MemberState => ({
    members: {},
    memberCount: null as number | null,
    loading: false,
    error: null,
  }),

  getters: {
    getMembersByGuild: (state) => (guildId: string) => {
      return state.members[guildId] || [];
    },

    getMemberCount: (state) => (guildId: string) => {
      return (state.members[guildId] || []).length;
    },

    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    ...memberActions,
  },
});
