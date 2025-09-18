import { joinRoom } from "../websocket/websocket.action";
import type {
  MembersListData,
  WebSocketResponse,
  MembersListPayload,
} from "../websocket/websocket.type";
import { useMemberStore } from "./member.store";
import type { Member } from "./member.type";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { useWebSocket } from "~/composables/useWebSocket";

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

    // Keep memberCount in sync when adding a member locally
    if (typeof memberStore.memberCount === "number") {
      memberStore.memberCount++;
    } else {
      memberStore.memberCount = memberStore.members[guildId].length;
    }
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

  async fetchMembersViaWebSocket(guildId: string) {
    const memberStore = useMemberStore();
    const { getMembers } = useWebSocket();

    memberStore.loading = true;
    memberStore.error = null;

    // Emit get_members event - response will be received via members_list event
    getMembers(guildId);

    joinRoom(`community_${guildId}`);
  },

  handleWebSocketMembersResponse(
    guildId: string,
    response: WebSocketResponse<MembersListData>
  ) {
    const memberStore = useMemberStore();

    if (response.success && response.data) {
      const members = response.data.members.map((member: Member) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
        lastActivityAt: member.lastActivityAt
          ? new Date(member.lastActivityAt)
          : undefined,
        lastXpClaimedAt: member.lastXpClaimedAt
          ? new Date(member.lastXpClaimedAt)
          : undefined,
      }));

      memberStore.members[guildId] = members;
      memberStore.memberCount = members.length;
      memberStore.loading = false;
      memberStore.error = null;
    } else {
      memberStore.error =
        response.error?.message || "Failed to get members via WebSocket";
      memberStore.loading = false;
    }
  },

  handleWebSocketMembersList(payload: MembersListPayload) {
    const memberStore = useMemberStore();
    // Extract communityId from the first member's guildId
    const communityId = payload.members[0]?.guildId;
    if (!communityId) {
      console.error("No communityId found in members list payload");
      return;
    }

    const members = payload.members.map((member: Member) => ({
      ...member,
      joinedAt: new Date(member.joinedAt),
      lastActivityAt: member.lastActivityAt
        ? new Date(member.lastActivityAt)
        : undefined,
      lastXpClaimedAt: member.lastXpClaimedAt
        ? new Date(member.lastXpClaimedAt)
        : undefined,
    }));

    memberStore.members[communityId] = members;
    memberStore.memberCount = members.length;
    memberStore.loading = false;
    memberStore.error = null;
  },
};
