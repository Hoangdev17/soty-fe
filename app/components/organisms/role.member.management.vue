<script setup lang="ts">
import { useMemberStore } from "~/stores/member/member.store";
import { useRoleStore } from "~/stores/roles/role.store";
import AddMemberModal from "~/components/molecules/add.member.modal.vue";

interface Props {
  guildId: string;
  roleId: string;
  isNewRole?: boolean;
}

const props = defineProps<Props>();

// Reactive refs
const showAddMemberModal = ref(false);
const memberSearchQuery = ref("");
const removingMemberId = ref<string | null>(null);
const isLoadingMembers = ref(false);

// Stores
const memberStore = useMemberStore();
const roleStore = useRoleStore();
const toast = useToast();

// Computed properties
const role = computed(() => roleStore.getRoleById(props.guildId, props.roleId));
const roleMembers = computed(() => {
  if (props.isNewRole || !role.value?.members) return [];
  return role.value.members.filter((member) => member?.user);
});

const filteredRoleMembers = computed(() => {
  if (!memberSearchQuery.value) return roleMembers.value;
  return roleMembers.value.filter((member) =>
    member?.user?.username
      ?.toLowerCase()
      .includes(memberSearchQuery.value.toLowerCase())
  );
});

// Methods
const fetchRoleMembers = async () => {
  if (props.isNewRole) return;

  try {
    isLoadingMembers.value = true;
    await roleStore.fetchRoleMembers(props.guildId, props.roleId);
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to load role members",
      color: "error",
    });
  } finally {
    isLoadingMembers.value = false;
  }
};

const isLoadingRemove = ref(false);

const removeMemberFromRole = async (memberId: string | undefined) => {
  if (!memberId) {
    toast.add({
      title: "Error",
      description: "Cannot remove member: invalid member data",
      color: "error",
    });
    return;
  }

  try {
    removingMemberId.value = memberId;
    isLoadingRemove.value = true;
    await roleStore.removeMemberRole(props.guildId, memberId, props.roleId);
    isLoadingRemove.value = false;
  } catch (error) {
    // Show error toast
    toast.add({
      title: "Error",
      description: "Failed to remove member from role",
      color: "error",
    });
    isLoadingRemove.value = false;
  } finally {
    removingMemberId.value = null;
    isLoadingRemove.value = false;
  }
};

// Load members on mount
onMounted(async () => {
  await fetchRoleMembers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Members Management Card -->
    <UCard class="bg-dark-800 border-dark-700">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold text-white">Role Members</h3>
          </div>
          <UButton
            @click="showAddMemberModal = true"
            variant="outline"
            color="primary"
            icon="i-lucide-plus"
            size="sm"
          >
            Add Member
          </UButton>
        </div>
      </template>

      <!-- Search Members -->
      <div class="mb-4">
        <UInput
          v-model="memberSearchQuery"
          placeholder="Search members..."
          icon="i-lucide-search"
          class="w-full"
        />
      </div>

      <!-- Members List -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
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
          v-else-if="filteredRoleMembers.length > 0"
          v-for="member in filteredRoleMembers"
          :key="member?.user?.id || 'unknown'"
          class="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :src="member?.user?.avatar"
              :alt="member?.user?.username || 'Unknown User'"
              size="sm"
            />
            <div>
              <p class="text-white font-medium">
                {{ member?.user?.username || "Unknown User" }}
              </p>
            </div>
          </div>
          <UButton
            @click="removeMemberFromRole(member.id)"
            variant="ghost"
            color="error"
            icon="i-lucide-trash"
            size="sm"
            :loading="isLoadingRemove"
            :disabled="!member?.user?.id"
          >
          </UButton>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!isLoadingMembers && filteredRoleMembers.length === 0"
          class="text-center py-8 text-gray-400"
        >
          <UIcon
            name="i-lucide-users"
            class="w-12 h-12 mx-auto mb-2 opacity-50"
          />
          <p>No members have this role</p>
        </div>
      </div>
    </UCard>

    <!-- Add Member Modal -->
    <AddMemberModal
      v-model:open="showAddMemberModal"
      :guild-id="guildId"
      :role-id="roleId"
      :is-new-role="isNewRole"
    />
  </div>
</template>
