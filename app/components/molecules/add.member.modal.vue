<script setup lang="ts">
import type { Member } from "~/stores/member/member.type";
import { useMemberStore } from "~/stores/member/member.store";
import { useRoleStore } from "~/stores/roles/role.store";

interface Props {
  guildId: string;
  roleId: string;
  isNewRole?: boolean;
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive refs
const availableMemberSearch = ref("");
const addingMemberId = ref<string | null>(null);
const isLoadingMembers = ref(false);

// Stores
const memberStore = useMemberStore();
const roleStore = useRoleStore();
const toast = useToast();

// Computed properties
const role = computed(() => roleStore.getRoleById(props.guildId, props.roleId));
const availableMembers = computed(() => {
  if (props.isNewRole) return memberStore.members[props.guildId] || [];

  const roleMembers = role.value?.members || [];
  const allMembers = memberStore.members[props.guildId] || [];

  // Filter out members who already have this role
  const existingMemberIds = new Set(
    roleMembers.map((roleMember) => roleMember?.user?.id).filter((id) => id) // Remove undefined/null values
  );

  return allMembers.filter(
    (member) => member?.userId && !existingMemberIds.has(member.userId)
  );
});

const filteredAvailableMembers = computed(() => {
  if (!availableMemberSearch.value.trim()) {
    return availableMembers.value;
  }

  const search = availableMemberSearch.value.toLowerCase().trim();
  return availableMembers.value.filter((member: Member) => {
    if (!member) return false;

    const username = member.user?.username?.toLowerCase() || "";
    const nickname = member.nickname?.toLowerCase() || "";
    const displayName = member.user?.globalName?.toLowerCase() || "";

    return (
      username.includes(search) ||
      nickname.includes(search) ||
      displayName.includes(search)
    );
  });
});

// Debug computed for filtering status
const filteringStatus = computed(() => {
  const totalMembers = memberStore.members[props.guildId]?.length || 0;
  const roleMemberCount = role.value?.members?.length || 0;
  const availableCount = availableMembers.value.length;
  const filteredCount = filteredAvailableMembers.value.length;

  return {
    totalMembers,
    roleMemberCount,
    availableCount,
    filteredCount,
    hasSearch: !!availableMemberSearch.value.trim(),
  };
});

// Watchers
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.guildId) {
      await fetchCommunityMembers();
      // Also fetch role members to ensure we have the latest data for filtering
      if (!props.isNewRole && props.roleId) {
        await fetchRoleMembers();
      }
    }
  },
  { immediate: false }
);

// Methods
const fetchCommunityMembers = async () => {
  try {
    isLoadingMembers.value = true;
    await memberStore.fetchMembers(props.guildId);
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to load community members",
      color: "error",
    });
  } finally {
    isLoadingMembers.value = false;
  }
};

const fetchRoleMembers = async () => {
  try {
    await roleStore.fetchRoleMembers(props.guildId, props.roleId);
  } catch (error) {}
};

const addMemberToRole = async (memberId: string) => {
  try {
    addingMemberId.value = memberId;
    await roleStore.assignMemberRoles(props.guildId, memberId, props.roleId);

    // Refresh role members to update filtering immediately
    if (!props.isNewRole && props.roleId) {
      await fetchRoleMembers();
    }

    // Close modal after successful addition
    emit("update:open", false);
  } catch (error) {
    // Show error toast
    toast.add({
      title: "Error",
      description: "Failed to add member to role",
      color: "error",
    });
  } finally {
    addingMemberId.value = null;
  }
};

const refreshData = async () => {
  await Promise.all([
    fetchCommunityMembers(),
    !props.isNewRole && props.roleId ? fetchRoleMembers() : Promise.resolve(),
  ]);
};

const closeModal = () => {
  emit("update:open", false);
  availableMemberSearch.value = "";
};
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)" size="md">
    <template #content>
      <UCard class="bg-dark-800 border-dark-700">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-plus" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold text-white">Add Member to Role</h3>
          </div>
        </template>

        <!-- Search Available Members -->
        <div class="space-y-4 w-full">
          <div class="flex items-center gap-2">
            <UInput
              v-model="availableMemberSearch"
              placeholder="Search members..."
              icon="i-lucide-search"
              class="flex-1"
            />
            <UButton
              @click="refreshData"
              variant="ghost"
              size="sm"
              :loading="isLoadingMembers"
              icon="i-lucide-refresh-ccw"
            >
              Refresh
            </UButton>
          </div>

          <div class="max-h-64 overflow-y-auto space-y-2">
            <!-- Loading state -->
            <div
              v-if="isLoadingMembers"
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
              v-else-if="filteredAvailableMembers.length > 0"
              v-for="member in filteredAvailableMembers"
              :key="member.id"
              class="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="member.avatar || member.user?.avatar"
                  :alt="member.user?.username || member.nickname"
                  size="sm"
                />
                <div>
                  <p class="text-white font-medium">
                    {{ member.nickname || member.user?.username }}
                  </p>
                  <p class="text-xs text-gray-400">
                    @{{ member.user?.username }}
                  </p>
                </div>
              </div>
              <UButton
                @click="addMemberToRole(member.id)"
                variant="outline"
                color="primary"
                size="sm"
                :loading="addingMemberId === member.id"
              >
                Add
              </UButton>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="
                !isLoadingMembers && filteredAvailableMembers.length === 0
              "
              class="text-center py-8 text-gray-400"
            >
              <UIcon
                name="i-lucide-users"
                class="w-12 h-12 mx-auto mb-2 opacity-50"
              />
              <p v-if="availableMemberSearch">
                No members found matching "{{ availableMemberSearch }}"
              </p>
              <p v-else-if="props.isNewRole">
                No members available for new role
              </p>
              <p v-else-if="filteringStatus.roleMemberCount > 0">
                All {{ filteringStatus.totalMembers }} community members already
                have this role ({{ filteringStatus.roleMemberCount }} members in
                role)
              </p>
              <p v-else>No members available or data not loaded yet</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton @click="closeModal" variant="ghost"> Cancel </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
