<script setup lang="ts">
import { useMemberStore } from "~/stores/member/member.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useRoleStore } from "~/stores/roles/role.store";
import KickMemberModal from "~/components/molecules/kick.member.modal.vue";
import BanMemberModal from "~/components/molecules/ban.member.modal.vue";

interface Props {
  guildId: string;
}

const props = defineProps<Props>();

// Reactive refs
const memberSearchQuery = ref("");
const kickingMemberId = ref<string | null>(null);
const banningMemberId = ref<string | null>(null);
const showKickConfirm = ref(false);
const showBanConfirm = ref(false);
const selectedMember = ref<any>(null);

// Stores
const memberStore = useMemberStore();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const roleStore = useRoleStore();
const toast = useToast();

onMounted(async () => {
  if (props.guildId) {
    await memberStore.fetchMembers(props.guildId);
    await roleStore.fetchRoles(props.guildId);
  }
});

// Computed properties
const members = computed(() => memberStore.getMembersByGuild(props.guildId));
const currentUserId = computed(() => authStore.user?.id);

const filteredMembers = computed(() => {
  if (!memberSearchQuery.value) return members.value;
  return members.value.filter((member) =>
    member?.user?.username
      ?.toLowerCase()
      .includes(memberSearchQuery.value.toLowerCase())
  );
});

// Check if current user can kick/ban
const canKickMembers = computed(() => {
  // TODO: Implement permission check based on user's roles
  return true; // For now, allow all users to kick (should be restricted to moderators/admins)
});

const canBanMembers = computed(() => {
  // TODO: Implement permission check based on user's roles
  return true; // For now, allow all users to ban (should be restricted to moderators/admins)
});

// Methods
const openKickConfirm = (member: any) => {
  selectedMember.value = member;
  showKickConfirm.value = true;
};

const openBanConfirm = (member: any) => {
  selectedMember.value = member;
  showBanConfirm.value = true;
};

const closeKickConfirm = () => {
  showKickConfirm.value = false;
  selectedMember.value = null;
};

const closeBanConfirm = () => {
  showBanConfirm.value = false;
  selectedMember.value = null;
};

const kickMember = async () => {
  if (!selectedMember.value) return;

  try {
    kickingMemberId.value = selectedMember.value.id;
    // TODO: Implement kick API call
    await communityStore.kickMember(props.guildId, selectedMember.value.id);

    toast.add({
      title: "Success",
      description: `${selectedMember.value.user.username} has been kicked from the community`,
      color: "success",
    });

    closeKickConfirm();
  } catch (error) {
    console.error("Failed to kick member:", error);
    toast.add({
      title: "Error",
      description: "Failed to kick member",
      color: "error",
    });
  } finally {
    kickingMemberId.value = null;
  }
};

const banMember = async () => {
  if (!selectedMember.value) return;

  try {
    banningMemberId.value = selectedMember.value.id;
    // TODO: Implement ban API call
    await communityStore.banMember(props.guildId, selectedMember.value.id);

    toast.add({
      title: "Success",
      description: `${selectedMember.value.user.username} has been banned from the community`,
      color: "success",
    });

    closeBanConfirm();
  } catch (error) {
    console.error("Failed to ban member:", error);
    toast.add({
      title: "Error",
      description: "Failed to ban member",
      color: "error",
    });
  } finally {
    banningMemberId.value = null;
  }
};

// Format date helper
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Get member roles using roleStore
const getMemberRoles = (member: any) => {
  // Get all roles for this guild
  const allRoles = roleStore.getRolesByGuild(props.guildId);

  // Find roles that this member has by checking if member is in role.members
  const memberRoles = allRoles.filter((role) =>
    role.members?.some(
      (roleMember: any) =>
        roleMember.memberId === member.id ||
        roleMember.member?.id === member.id ||
        roleMember.id === member.id
    )
  );

  // Return role objects with color, sorted by position (highest first)
  return memberRoles.sort((a, b) => (b.position || 0) - (a.position || 0));
};
</script>

<template>
  <div class="space-y-6 bg-dark-900">
    <!-- Members Management Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Member Management</h2>
        <p class="text-gray-400 mt-1">
          Manage community members and their permissions
        </p>
      </div>
      <div class="text-sm text-gray-400">{{ members.length }} members</div>
    </div>

    <!-- Search Members -->
    <UCard class="bg-dark-800 border-dark-700">
      <UInput
        v-model="memberSearchQuery"
        placeholder="Search members by username..."
        icon="i-lucide-search"
        class="w-full"
      />
    </UCard>

    <!-- Members List -->
    <UCard class="bg-dark-800 border-dark-700">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-users" class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold text-white">Community Members</h3>
        </div>
      </template>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        <!-- Loading state -->
        <div
          v-if="memberStore.loading"
          class="flex items-center justify-center py-8"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-6 h-6 animate-spin text-primary"
          />
          <span class="ml-2 text-gray-400">Loading members...</span>
        </div>

        <!-- Member list -->
        <div
          v-else-if="filteredMembers.length > 0"
          v-for="member in filteredMembers"
          :key="member.id"
          class="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
        >
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Avatar -->
            <UAvatar
              :src="member.user?.avatar"
              :alt="member.user?.username || 'Unknown User'"
              size="md"
              class="flex-shrink-0"
            />

            <!-- Member Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-white font-medium truncate">
                  {{ member.user?.username || "Unknown User" }}
                </p>
                <span v-if="member.user?.id === currentUserId"> (You) </span>
                <span class="text-xs text-gray-500 flex-shrink-0">
                  Joined {{ formatDate(member.joinedAt) }}
                </span>
              </div>

              <!-- Roles -->
              <div class="flex items-center gap-2 mt-1">
                <UBadge
                  v-for="role in getMemberRoles(member)"
                  :key="role.id"
                  variant="soft"
                  size="sm"
                  class="flex-shrink-0"
                  :style="{
                    backgroundColor: role.color || '#99aab5',
                    color: 'white',
                  }"
                >
                  {{ role.name }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center gap-2 flex-shrink-0"
            v-if="member.user?.id !== currentUserId"
          >
            <!-- Kick Button -->
            <UTooltip text="Kick Member" v-if="canKickMembers">
              <UButton
                @click="openKickConfirm(member)"
                variant="ghost"
                color="error"
                icon="i-lucide-user-x"
                size="sm"
                :loading="kickingMemberId === member.id"
                :disabled="!member.kickable"
              />
            </UTooltip>

            <!-- Ban Button -->
            <UTooltip text="Ban Member" v-if="canBanMembers">
              <UButton
                @click="openBanConfirm(member)"
                variant="ghost"
                color="error"
                icon="i-lucide-ban"
                size="sm"
                :loading="banningMemberId === member.id"
                :disabled="!member.bannable"
              />
            </UTooltip>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!memberStore.loading && filteredMembers.length === 0"
          class="text-center py-8 text-gray-400"
        >
          <UIcon
            name="i-lucide-users"
            class="w-12 h-12 mx-auto mb-2 opacity-50"
          />
          <p>No members found</p>
        </div>
      </div>
    </UCard>

    <!-- Kick Member Modal -->
    <KickMemberModal
      :model-value="showKickConfirm"
      @update:model-value="(value) => (showKickConfirm = value)"
      :member="selectedMember"
      :loading="kickingMemberId === selectedMember?.id"
      @confirm="kickMember"
    />

    <!-- Ban Member Modal -->
    <BanMemberModal
      :model-value="showBanConfirm"
      @update:model-value="(value) => (showBanConfirm = value)"
      :member="selectedMember"
      :loading="banningMemberId === selectedMember?.id"
      @confirm="banMember"
    />
  </div>
</template>
