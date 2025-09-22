<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useRoleStore } from "~/stores/roles/role.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Channel } from "~/stores/channels/channel.type";
import type { ContextMenuItem } from "@nuxt/ui";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();

const items = ref<ContextMenuItem[][]>([
  [
    {
      label: "Hồ sơ",
      icon: "i-lucide-user",
    },
    {
      label: "Nhắn tin",
      icon: "i-lucide-message-circle",
    },
  ],
]);

const memberStore = useMemberStore();
const roleStore = useRoleStore();
const authStore = useAuthStore();
const route = useRoute();

const refreshMembers = async () => {
  const currentGuildId = route.params.guild_id as string;
  if (currentGuildId) {
    try {
      await memberStore.fetchMembersViaWebSocket(currentGuildId);
    } catch (error) {
      console.error("Failed to refresh members:", error);
    }
  }
};

const emit = defineEmits<{
  toggleMemberPanel: [];
  closeMemberPanel: [];
}>();

// Local state for modal
const isMemberModalOpen = ref(false);

// Watch prop changes and update local state
watch(
  () => props.isOpenSlideoverMember,
  (newValue) => {
    isMemberModalOpen.value = newValue;
  },
  { immediate: true }
);

// Handle modal open/close events
const handleMemberModalUpdate = (value: boolean) => {
  isMemberModalOpen.value = value;
  if (!value) {
    emit("closeMemberPanel");
  }
};

const toggleMemberPanel = () => {
  emit("toggleMemberPanel");
};

const closeMemberPanel = () => {
  emit("closeMemberPanel");
};

// Computed properties for members grouped by role
const guildMembers = computed(() => {
  if (!route.params.guild_id) return [];
  return memberStore.getMembersByGuild(route.params.guild_id as string);
});

const guildRoles = computed(() => {
  if (!route.params.guild_id) return [];
  return roleStore.getRolesByGuild(route.params.guild_id as string);
});

const membersByRole = computed(() => {
  if (!guildMembers.value.length || !guildRoles.value.length) return {};

  const result: Record<string, any[]> = {};

  // Sort roles by position (highest first), but with special handling for permissions
  const sortedRoles = [...guildRoles.value].sort((a, b) => {
    // Special case: @everyone should always be last regardless of position
    if (a.name === "@everyone") return 1;
    if (b.name === "@everyone") return -1;

    // Prioritize roles with ADMINISTRATOR permission
    const aHasAdmin = a.permissions?.includes("ADMINISTRATOR") || false;
    const bHasAdmin = b.permissions?.includes("ADMINISTRATOR") || false;

    if (aHasAdmin && !bHasAdmin) return -1;
    if (!aHasAdmin && bHasAdmin) return 1;

    // Then sort by position (highest first)
    return b.position - a.position;
  });

  // Initialize result with all roles
  sortedRoles.forEach((role) => {
    if (role.id) {
      result[role.id] = [];
    }
  });

  // Group members by their roles based on role.members array
  sortedRoles.forEach((role) => {
    if (!role.id || !role.members) return;

    role.members.forEach((roleMember: any) => {
      // Find the actual member object by memberId
      const member = guildMembers.value.find(
        (m) => m.id === roleMember.memberId
      );
      if (member && result[role.id]) {
        // Check if member is already in a higher priority role
        const alreadyAssigned = Object.keys(result).some((roleId) => {
          if (roleId === role.id) return false;
          const assignedRole = sortedRoles.find((r) => r.id === roleId);
          if (!assignedRole) return false;

          // Check if this role has higher priority
          const currentRoleIndex = sortedRoles.findIndex(
            (r) => r.id === role.id
          );
          const assignedRoleIndex = sortedRoles.findIndex(
            (r) => r.id === roleId
          );

          return (
            assignedRoleIndex < currentRoleIndex &&
            result[roleId] &&
            result[roleId].some((m) => m.id === member.id)
          );
        });

        if (!alreadyAssigned) {
          // Remove from lower priority roles
          Object.keys(result).forEach((roleId) => {
            if (roleId !== role.id && result[roleId]) {
              result[roleId] = result[roleId].filter((m) => m.id !== member.id);
            }
          });

          if (result[role.id]) {
            result[role.id]!.push(member);
          }
        }
      }
    });
  });

  return result;
});

// Get roles with members for display
const rolesWithMembers = computed(() => {
  const roles = guildRoles.value.filter((role) => {
    if (!role.id) return false;
    const roleMembers = membersByRole.value[role.id];
    return roleMembers && roleMembers.length > 0;
  });

  // Sort with same priority logic: ADMIN first, then position, @everyone last
  return roles.sort((a, b) => {
    // Special case: @everyone should always be last
    if (a.name === "@everyone") return 1;
    if (b.name === "@everyone") return -1;

    // Prioritize roles with ADMINISTRATOR permission
    const aHasAdmin = a.permissions?.includes("ADMINISTRATOR") || false;
    const bHasAdmin = b.permissions?.includes("ADMINISTRATOR") || false;

    if (aHasAdmin && !bHasAdmin) return -1;
    if (!aHasAdmin && bHasAdmin) return 1;

    // Then sort by position (highest first)
    return b.position - a.position;
  });
});
</script>

<template>
  <div class="flex flex-col h-full bg-dark-800">
    <!-- Channel Header -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
    >
      <div class="flex items-center space-x-3">
        <UButton
          @click="$router.back()"
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white p-1"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        </UButton>
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-mic" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <UButton
          class="p-1 text-[#b9bbbe] hover:text-white"
          variant="ghost"
          @click="toggleMemberPanel"
        >
          <UIcon name="i-lucide-users-round" class="w-5 h-5" />
        </UButton>
      </div>
    </div>

    <!-- Mobile Voice Content -->
    <div
      class="flex-1 flex flex-col justify-center items-center bg-dark-800 p-4"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-mic"
          class="w-12 h-12 text-[#72767d] mb-3 mx-auto"
        />
        <h2 class="text-white text-xl font-bold mb-2">
          Kết nối với kênh voice #{{ currentChannel?.name }}
        </h2>
        <p class="text-[#72767d] text-sm mb-4">
          Nhấp vào nút dưới đây để tham gia kênh voice.
        </p>
        <UButton
          icon="i-lucide-mic"
          variant="solid"
          color="primary"
          size="lg"
          class="mb-3 w-full max-w-xs"
        >
          Tham gia Voice
        </UButton>
        <p class="text-[#72767d] text-xs">
          Hoặc sử dụng phím tắt: Ctrl + Shift + V
        </p>
      </div>

      <!-- Connected Users Mobile -->
      <div class="mt-6 w-full max-w-sm">
        <h3 class="text-white text-base font-semibold mb-3">Đang kết nối</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-3 p-3 bg-dark-700 rounded-md">
            <UAvatar
              :src="authStore.user?.avatar || undefined"
              :alt="authStore.user?.username"
              size="sm"
              class="flex-shrink-0"
            />
            <div class="flex-1">
              <span class="text-white font-medium text-sm">{{
                authStore.user?.username
              }}</span>
              <span class="text-[#72767d] text-xs ml-2">(Bạn)</span>
            </div>
            <div class="flex items-center gap-1">
              <UIcon name="i-lucide-mic" class="w-4 h-4 text-green-400" />
              <UIcon
                name="i-lucide-headphones"
                class="w-4 h-4 text-green-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Members Modal for Mobile -->
    <UModal
      :open="isMemberModalOpen"
      @update:open="handleMemberModalUpdate"
      class="w-full h-full"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
            Hoạt động —
            {{
              memberStore.getMemberCount(
                (route.params.guild_id as string) || ""
              )
            }}
          </h3>
          <UButton
            @click="closeMemberPanel"
            variant="ghost"
            class="text-[#b9bbbe] hover:text-white p-1"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </UButton>
        </div>
      </template>

      <template #body>
        <div class="space-y-3">
          <!-- Members List -->
          <div v-if="memberStore.isLoading" class="text-center py-4">
            <UIcon
              name="i-lucide-loader-2"
              class="w-6 h-6 animate-spin mx-auto text-gray-400"
            />
            <p class="text-gray-400 text-sm mt-2">Đang tải...</p>
          </div>

          <div v-else-if="memberStore.getError" class="text-center py-4">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-6 h-6 mx-auto text-red-400"
            />
            <p class="text-red-400 text-sm mt-2">{{ memberStore.getError }}</p>
          </div>

          <div v-else class="space-y-3">
            <!-- Display members grouped by role -->
            <div
              v-for="role in rolesWithMembers"
              :key="role.id"
              class="space-y-2"
            >
              <!-- Role header -->
              <div class="flex items-center gap-2 px-2 py-1">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: role.color }"
                ></div>
                <span
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {{ role.name }} — {{ membersByRole[role.id!]?.length || 0 }}
                </span>
              </div>

              <!-- Members in this role -->
              <UContextMenu
                :items="items"
                :ui="{
                  content: 'w-48',
                }"
                class="space-y-1 ml-2"
              >
                <div
                  v-for="member in membersByRole[role.id!]"
                  :key="member.id"
                  class="flex items-center gap-3 p-2 rounded-md hover:bg-dark-700 transition-colors"
                >
                  <UAvatar
                    :src="member.avatar"
                    :alt="member.nickname || member.user?.username"
                    size="md"
                    :chip="{
                      color: 'success',
                      position: 'bottom-right',
                    }"
                    class="flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-white font-medium text-sm truncate">
                        {{ member.nickname || member.user?.username }}
                      </span>
                      <span
                        v-if="member.user?.id === authStore.user?.id"
                        class="text-xs text-green-400 font-medium"
                      >
                        Bạn
                      </span>
                    </div>
                    <div class="flex items-center gap-1 text-xs text-gray-400">
                      <span>{{ member.user?.username }}</span>
                    </div>
                  </div>
                </div>
              </UContextMenu>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* Custom avatar chip positioning */
:deep(.u-avatar-chip) {
  bottom: 0 !important;
  right: 0 !important;
  transform: translate(25%, 25%) !important;
}

/* Status indicator styles */
.status-online {
  background-color: #23a559;
}

.status-offline {
  background-color: #80848e;
}

.status-idle {
  background-color: #f39c12;
}

.status-dnd {
  background-color: #f04747;
}
</style>
