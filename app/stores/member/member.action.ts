import { useMemberStore } from "./member.store";
import type { Member } from "./member.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

export const memberActions = {
  async fetchMembers(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const memberStore = useMemberStore();

    memberStore.loading = true;
    memberStore.error = null;

    try {
      const members = await fetchWithAuth<Member[]>(
        `/community/${guildId}/members`,
        {
          method: "GET",
        }
      );

      memberStore.members[guildId] = members.map((member) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
        lastActivityAt: member.lastActivityAt
          ? new Date(member.lastActivityAt)
          : undefined,
        lastXpClaimedAt: member.lastXpClaimedAt
          ? new Date(member.lastXpClaimedAt)
          : undefined,
      }));

      memberStore.memberCount = members.length;

      return members;
    } catch (error) {
      memberStore.error =
        error instanceof Error ? error.message : "Failed to fetch members";
      throw error;
    } finally {
      memberStore.loading = false;
    }
  },

  async addMember(guildId: string, member: Member) {
    const memberStore = useMemberStore();

    if (!memberStore.members[guildId]) {
      memberStore.members[guildId] = [];
    }

    memberStore.members[guildId].push(member);
  },

  async removeMember(guildId: string, memberId: string) {
    const memberStore = useMemberStore();

    if (memberStore.members[guildId]) {
      memberStore.members[guildId] = memberStore.members[guildId].filter(
        (member: Member) => member.id !== memberId
      );
    }
  },

  clearMembers(guildId: string) {
    const memberStore = useMemberStore();
    delete memberStore.members[guildId];
  },
};
