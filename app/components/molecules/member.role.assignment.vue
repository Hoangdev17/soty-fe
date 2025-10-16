<script setup lang="ts">
import { useRoleStore } from "~/stores/roles/role.store";
import { useMemberStore } from "~/stores/member/member.store";
import type { Role } from "~/stores/roles/role.type";
import type { Member } from "~/stores/member/member.type";

interface Props {
  guildId: string;
  memberId?: string;
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const roleStore = useRoleStore();
const memberStore = useMemberStore();

// Reactive refs
const isLoading = ref(false);
const searchQuery = ref("");
const selectedMember = ref<Member | null>(null);
const memberRoles = ref<string[]>([]);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const roles = computed(() => roleStore.getRolesByGuild(props.guildId));
const members = computed(() => memberStore.getMembersByGuild(props.guildId));

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value;
  return members.value.filter(
    (member) =>
      member.user?.username
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      member.nickname?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const availableRoles = computed(() => {
  return roles.value.filter(
    (role) => !role.managed && role.name !== "@everyone"
  );
});

// Watch for member prop changes
watch(
  () => props.memberId,
  async (newMemberId) => {
    if (newMemberId && props.open) {
      await loadMemberData(newMemberId);
    }
  },
  { immediate: true }
);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      if (props.memberId) {
        await loadMemberData(props.memberId);
      }
      await loadData();
    } else {
      resetForm();
    }
  }
);

// Methods
const loadData = async () => {
  try {
    isLoading.value = true;
    await Promise.all([
      roleStore.fetchRoles(props.guildId),
      memberStore.fetchMembers(props.guildId),
    ]);
  } catch (err) {
  } finally {
    isLoading.value = false;
  }
};

const loadMemberData = async (memberId: string) => {
  const member = members.value.find((m) => m.id === memberId);
  if (member) {
    selectedMember.value = member;
    memberRoles.value = member.roles?.map((role: any) => role.id) || [];
  }
};

const selectMember = (member: Member) => {
  selectedMember.value = member;
  memberRoles.value = member.roles?.map((role: any) => role.id) || [];
};

const toggleRole = (roleId: string) => {
  const index = memberRoles.value.indexOf(roleId);
  if (index === -1) {
    memberRoles.value.push(roleId);
  } else {
    memberRoles.value.splice(index, 1);
  }
};

const hasRole = (roleId: string): boolean => {
  return memberRoles.value.includes(roleId);
};

const saveRoles = async () => {
  if (!selectedMember.value) return;

  try {
    isLoading.value = true;
    await roleStore.assignMemberRoles(
      props.guildId,
      selectedMember.value.id,
      memberRoles.value
    );

    const toast = useToast();
    toast.add({
      title: "Roles updated successfully",
      color: "success",
      duration: 3000,
    });

    isOpen.value = false;
  } catch (err) {
    const toast = useToast();
    toast.add({
      title: "Failed to update roles",
      description: err instanceof Error ? err.message : "Unknown error",
      color: "error",
      duration: 5000,
    });
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  selectedMember.value = null;
  memberRoles.value = [];
  searchQuery.value = "";
};

const getMemberDisplayName = (member: Member): string => {
  return member.nickname || member.user?.username || "Unknown User";
};

const getColorClass = (color: string) => {
  return {
    backgroundColor: color,
    borderColor: color,
  };
};
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-2xl">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-user-cog" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Manage Member Roles</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Member Selection (if no specific member provided) -->
        <div v-if="!props.memberId" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-300"
              >Select Member</label
            >
            <UInput
              v-model="searchQuery"
              placeholder="Search members..."
              icon="i-lucide-search"
              class="mb-3"
            />
          </div>

          <div
            class="max-h-48 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-2"
          >
            <div
              v-for="member in filteredMembers"
              :key="member.id"
              @click="selectMember(member)"
              class="flex items-center gap-3 p-3 rounded cursor-pointer transition-colors hover:bg-gray-700"
              :class="{ 'bg-gray-700': selectedMember?.id === member.id }"
            >
              <UAvatar
                :src="member.user?.avatar"
                :alt="getMemberDisplayName(member)"
                size="sm"
              />
              <div>
                <div class="font-medium text-white">
                  {{ getMemberDisplayName(member) }}
                </div>
                <div
                  v-if="member.user?.username !== getMemberDisplayName(member)"
                  class="text-sm text-gray-400"
                >
                  @{{ member.user?.username }}
                </div>
              </div>
            </div>

            <div
              v-if="filteredMembers.length === 0"
              class="text-center py-4 text-gray-400"
            >
              No members found
            </div>
          </div>
        </div>

        <!-- Role Assignment -->
        <div v-if="selectedMember" class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <UAvatar
              :src="selectedMember.user?.avatar"
              :alt="getMemberDisplayName(selectedMember)"
              size="md"
            />
            <div>
              <div class="font-medium text-white">
                {{ getMemberDisplayName(selectedMember) }}
              </div>
              <div
                v-if="
                  selectedMember.user?.username !==
                  getMemberDisplayName(selectedMember)
                "
                class="text-sm text-gray-400"
              >
                @{{ selectedMember.user?.username }}
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-white mb-3">Assign Roles</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="role in availableRoles"
                :key="role.id"
                class="flex items-center justify-between p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-4 h-4 rounded-full border-2"
                    :style="getColorClass(role.color)"
                  ></div>
                  <div>
                    <div class="font-medium text-white">{{ role.name }}</div>
                    <div class="text-sm text-gray-400">
                      {{ role.memberCount || 0 }} members
                    </div>
                  </div>
                </div>
                <UCheckbox
                  :checked="hasRole(role.id)"
                  @change="toggleRole(role.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <div class="flex items-center gap-3">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
            ></div>
            <span class="text-gray-400">Loading...</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton
          color="primary"
          @click="saveRoles"
          :loading="isLoading"
          :disabled="!selectedMember"
        >
          Save Roles
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
