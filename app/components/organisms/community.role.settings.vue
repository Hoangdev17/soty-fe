<script setup lang="ts">
import { useRoleStore } from "~/stores/roles/role.store";
import type {
  Role,
  CreateRoleData,
  UpdateRoleData,
} from "~/stores/roles/role.type";
import RoleIcon from "../atoms/role.icon.vue";

interface Props {
  guildId: string;
}

const props = defineProps<Props>();

// Define emits
const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const route = useRoute();
const roleStore = useRoleStore();
// Reactive refs
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedRole = ref<Role | null>(null);
const isDeleteConfirmOpen = ref(false);
const roleToDelete = ref<Role | null>(null);
const searchQuery = ref("");

// Form data
const createForm = ref<CreateRoleData>({
  name: "",
  color: "#99aab5",
  hoist: false,
  mentionable: true,
  permissions: [],
});

const editForm = ref<UpdateRoleData>({});

// Computed
const roles = computed(() => {
  const allRoles = roleStore.getRolesByGuild(props.guildId);
  // Filter out @everyone role from the list
  const filteredRoles = allRoles.filter(
    (role: Role) => role.name !== "@everyone"
  );

  if (!searchQuery.value.trim()) {
    return filteredRoles;
  }
  return filteredRoles.filter((role: Role) =>
    role.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const everyoneRole = computed(() => {
  const allRoles = roleStore.getRolesByGuild(props.guildId);
  return allRoles.find((role: Role) => role.name === "@everyone");
});

const isLoading = computed(() => roleStore.isLoading);
const error = computed(() => roleStore.getError);
const permissionCategories = computed(() => {
  const categories = [
    "general",
    "text",
    "voice",
    "management",
    "administrative",
  ];
  return categories.map((category) => ({
    name: category,
    permissions: roleStore.getPermissionsByCategory(category),
  }));
});

// Lifecycle
onMounted(async () => {
  try {
    await roleStore.fetchRoles(props.guildId);
  } catch (err) {}
});

// Methods
const closeSettings = async () => {
  // Navigate to community page with current community name
  const guildId = route.params.guild_id as string;

  router.push(`/community/introduce/${guildId}`);
};
const openCreateModal = () => {
  createForm.value = {
    name: "",
    color: "#99aab5",
    hoist: false,
    mentionable: true,
    permissions: [],
  };
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
  createForm.value = {
    name: "",
    color: "#99aab5",
    hoist: false,
    mentionable: true,
    permissions: [],
  };
};

const openEditModal = (role: Role) => {
  // Navigate to role edit page instead of opening modal
  const guildUsername = route.params.guid_username as string;
  const guildId = route.params.guild_id as string;
  router.push(`/community/@${guildUsername}-${guildId}/roles/${role.id}`);
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  selectedRole.value = null;
  editForm.value = {};
};

const createRole = async () => {
  if (!createForm.value.name.trim()) return;

  try {
    await roleStore.createRole(props.guildId, createForm.value);
    closeCreateModal();

    const toast = useToast();
    toast.add({
      title: "Role created successfully",
      color: "success",
      duration: 3000,
    });
  } catch (err) {
    const toast = useToast();
    toast.add({
      title: "Failed to create role",
      description: err instanceof Error ? err.message : "Unknown error",
      color: "error",
      duration: 5000,
    });
  }
};

const updateRole = async () => {
  if (!selectedRole.value || !editForm.value.name?.trim()) return;

  try {
    await roleStore.updateRole(
      props.guildId,
      selectedRole.value.id,
      editForm.value
    );
    closeEditModal();

    const toast = useToast();
    toast.add({
      title: "Role updated successfully",
      color: "success",
      duration: 3000,
    });
  } catch (err) {
    const toast = useToast();
    toast.add({
      title: "Failed to update role",
      description: err instanceof Error ? err.message : "Unknown error",
      color: "error",
      duration: 5000,
    });
  }
};

const confirmDeleteRole = (role: Role) => {
  roleToDelete.value = role;
  isDeleteConfirmOpen.value = true;
};

const deleteRole = async () => {
  if (!roleToDelete.value) return;

  try {
    await roleStore.deleteRole(props.guildId, roleToDelete.value.id);
    isDeleteConfirmOpen.value = false;
    roleToDelete.value = null;

    const toast = useToast();
    toast.add({
      title: "Role deleted successfully",
      color: "success",
      duration: 3000,
    });
  } catch (err) {
    const toast = useToast();
    toast.add({
      title: "Failed to delete role",
      description: err instanceof Error ? err.message : "Unknown error",
      color: "error",
      duration: 5000,
    });
  }
};

const togglePermission = (permissionId: string, formData: any) => {
  if (!formData.permissions) {
    formData.permissions = [];
  }

  const index = formData.permissions.indexOf(permissionId);
  if (index === -1) {
    formData.permissions.push(permissionId);
  } else {
    formData.permissions.splice(index, 1);
  }
};

const hasPermission = (permissionId: string, formData: any): boolean => {
  return formData.permissions?.includes(permissionId) || false;
};

// Drag & drop state
const draggingRoleId = ref<string | null>(null);
const dragOverRoleId = ref<string | null>(null);

const handleDragStart = (event: DragEvent, roleId: string) => {
  draggingRoleId.value = roleId;
  event.dataTransfer?.setData("text/plain", roleId);
  event.dataTransfer!.effectAllowed = "move";

  // Create a custom drag image
  const dragElement = event.target as HTMLElement;
  const rect = dragElement.getBoundingClientRect();
  event.dataTransfer?.setDragImage(
    dragElement,
    rect.width / 2,
    rect.height / 2
  );
};

const handleDragOver = (event: DragEvent, roleId: string) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = "move";

  if (draggingRoleId.value !== roleId) {
    dragOverRoleId.value = roleId;
  }
};

const handleDragLeave = () => {
  dragOverRoleId.value = null;
};

const handleDragEnd = () => {
  draggingRoleId.value = null;
  dragOverRoleId.value = null;
};

const handleDrop = async (event: DragEvent, targetRoleId: string) => {
  event.preventDefault();
  dragOverRoleId.value = null;

  const sourceId =
    draggingRoleId.value || event.dataTransfer?.getData("text/plain");
  if (!sourceId) return;
  if (sourceId === targetRoleId) return;

  // Reorder locally
  const list = [...roles.value];
  const sourceIndex = list.findIndex((r) => r.id === sourceId);
  const targetIndex = list.findIndex((r) => r.id === targetRoleId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  const [moved] = list.splice(sourceIndex, 1);
  if (!moved) return;
  list.splice(targetIndex, 0, moved);

  // Update local store ordering optimistically
  (roleStore.roles as any)[props.guildId] = list as Role[];

  // Persist positions to backend (position: index order)
  try {
    const positions = list.map((r, idx) => ({
      id: r.id,
      position: list.length - idx,
    }));
    await roleStore.updateRolePositions(props.guildId, positions);

    const toast = useToast();
    toast.add({
      title: "Role order updated",
      color: "success",
      duration: 2000,
    });
  } catch (err) {
    const toast = useToast();
    toast.add({
      title: "Failed to update role order",
      description: "Please try again",
      color: "error",
      duration: 3000,
    });

    // Revert local changes on error
    await roleStore.fetchRoles(props.guildId);
  } finally {
    draggingRoleId.value = null;
  }
};

const { isMobile } = useBreakpoint();
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto relative bg-dark-900">
    <!-- Close button (fixed position) -->
    <div
      v-if="!isMobile"
      class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1"
    >
      <UButton
        v-if="!isMobile"
        @click="closeSettings"
        class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors flex items-center justify-center border border-dark-600"
        title="Đóng Roles"
      >
        <UIcon name="i-lucide-x" class="w-4 h-4 text-white" />
      </UButton>
      <span class="text-xs text-gray-400 font-medium">ESC</span>
    </div>

    <!-- Error Display -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      class="mb-4"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
        ></div>
        <span class="text-gray-400">Loading roles...</span>
      </div>
    </div>

    <!-- Roles List as Draggable Cards -->
    <!-- Roles List as Draggable Cards -->
    <div v-else class="space-y-4">
      <!-- @everyone Role Card (Fixed at top) -->
      <div v-if="everyoneRole" class="mb-6">
        <div
          class="text-sm text-gray-400 mb-2 uppercase tracking-wide font-medium"
        >
          Default Role
        </div>
        <div
          class="bg-dark-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
        >
          <div class="px-4 py-2 pl-8">
            <div class="flex items-center">
              <!-- Role Info - Left Column -->
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <RoleIcon
                  :color="everyoneRole.color"
                  :role-id="everyoneRole.id"
                />
                <h3 class="font-medium text-white truncate">
                  {{ everyoneRole.name }}
                </h3>
              </div>

              <!-- Member Count - Center Column -->
              <div class="flex items-center justify-center flex-1">
                <span class="text-sm text-gray-400">{{
                  everyoneRole.memberCount || 0
                }}</span>
              </div>

              <!-- Action Buttons - Right Column -->
              <div
                class="flex items-center justify-center w-20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div class="flex items-center gap-1">
                  <UButton
                    @click.stop="openEditModal(everyoneRole)"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    icon="i-lucide-edit"
                    class="h-8 w-8"
                  />
                  <!-- No delete button for @everyone -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search roles..."
            icon="i-lucide-search"
            class="w-full"
          />
        </div>
      </div>

      <!-- Table Header -->
      <div class="border-b border-gray-700 pb-2">
        <div class="flex items-center px-4 py-2">
          <div class="flex items-center gap-3 flex-1">
            <div class="w-6"></div>
            <!-- Space for drag handle -->
            <span
              class="text-sm font-medium text-gray-400 uppercase tracking-wide"
              >Role</span
            >
          </div>
          <div class="flex items-center justify-center flex-1">
            <span
              class="text-sm font-medium text-gray-400 uppercase tracking-wide text-center"
              >Members</span
            >
          </div>
          <div class="w-20"></div>
          <!-- Space for action buttons -->
        </div>
      </div>

      <div class="text-sm text-gray-400 mb-4">
        Drag and drop to reorder roles. Higher roles have more authority.
      </div>

      <div class="space-y-2">
        <div
          v-for="role in roles"
          :key="role.id"
          class="role-card group relative bg-dark-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-grab active:cursor-grabbing"
          :class="{
            'opacity-50': draggingRoleId === role.id,
            'border-blue-500 bg-blue-500/10': dragOverRoleId === role.id,
            'transform scale-[1.02]': dragOverRoleId === role.id,
          }"
          draggable="true"
          @dragstart="(e) => handleDragStart(e, role.id)"
          @dragover="(e) => handleDragOver(e, role.id)"
          @dragleave="handleDragLeave"
          @dragend="handleDragEnd"
          @drop="(e) => handleDrop(e, role.id)"
        >
          <!-- Drag Handle -->
          <div
            class="drag-handle absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity"
          >
            <UIcon
              name="i-lucide-grip-vertical"
              class="w-4 h-4 text-gray-500"
            />
          </div>

          <!-- Role Card Content -->
          <div class="px-4 py-2 pl-8">
            <div class="flex items-center">
              <!-- Role Info - Left Column -->
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- Custom Role Icon -->
                <RoleIcon :color="role.color" :role-id="role.id" />

                <!-- Role Name -->
                <h3 class="font-medium text-white truncate">{{ role.name }}</h3>
              </div>

              <!-- Member Count - Center Column -->
              <div class="flex items-center justify-center flex-1">
                <span class="text-sm text-gray-400">{{
                  role.memberCount || 0
                }}</span>
              </div>

              <!-- Action Buttons - Right Column -->
              <div
                class="flex items-center justify-center w-20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div class="flex items-center gap-1">
                  <UButton
                    @click.stop="openEditModal(role)"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    icon="i-lucide-edit"
                    :disabled="role.managed"
                    class="h-8 w-8"
                  />
                  <UButton
                    @click.stop="confirmDeleteRole(role)"
                    variant="ghost"
                    color="error"
                    size="sm"
                    icon="i-lucide-trash"
                    :disabled="role.managed || role.name === '@everyone'"
                    class="h-8 w-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Empty State -->
      <div v-if="roles.length === 0" class="text-center py-12">
        <UIcon
          name="i-lucide-users"
          class="w-12 h-12 text-gray-500 mx-auto mb-4"
        />
        <h3 class="text-lg font-medium text-gray-300 mb-2">No roles yet</h3>
        <p class="text-gray-500 mb-4">Create your first role to get started</p>
        <UButton @click="openCreateModal" color="primary">
          Create Role
        </UButton>
      </div>
    </div>

    <!-- Create Role Modal -->
    <UModal v-model:open="isCreateModalOpen" class="max-w-2xl">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-plus" class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Create New Role</h3>
        </div>
      </template>

      <template #body>
        <form @submit.prevent="createRole" class="space-y-6">
          <!-- Basic Settings -->
          <div class="space-y-4">
            <h4 class="font-medium text-white">Basic Settings</h4>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-300"
                >Role Name</label
              >
              <UInput
                v-model="createForm.name"
                placeholder="Enter role name"
                required
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-300"
                >Role Color</label
              >
              <div class="flex items-center gap-3">
                <input
                  v-model="createForm.color"
                  type="color"
                  class="w-12 h-10 rounded border border-gray-600 bg-dark-700"
                />
                <UInput
                  v-model="createForm.color"
                  placeholder="#99aab5"
                  class="flex-1"
                />
              </div>
            </div>

            <div class="space-y-2">
              <UCheckbox
                v-model="createForm.hoist"
                label="Display role members separately from online members"
              />
              <UCheckbox
                v-model="createForm.mentionable"
                label="Allow anyone to @mention this role"
              />
            </div>
          </div>

          <!-- Permissions -->
          <div class="space-y-4">
            <h4 class="font-medium text-white">Permissions</h4>

            <div
              v-for="category in permissionCategories"
              :key="category.name"
              class="space-y-3"
            >
              <h5
                class="text-sm font-medium text-gray-400 uppercase tracking-wider"
              >
                {{ category.name }}
              </h5>
              <div class="grid grid-cols-1 gap-2">
                <div
                  v-for="permission in category.permissions"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div>
                    <div class="font-medium text-white">
                      {{ permission.name }}
                    </div>
                    <div class="text-sm text-gray-400">
                      {{ permission.description }}
                    </div>
                  </div>
                  <UCheckbox
                    :checked="hasPermission(permission.id, createForm)"
                    @change="togglePermission(permission.id, createForm)"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" color="primary" @click="closeCreateModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="createRole"
            :loading="isLoading"
            :disabled="!createForm.name.trim()"
          >
            Create Role
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit Role Modal -->
    <UModal v-model:open="isEditModalOpen" class="max-w-2xl">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-edit" class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Edit Role</h3>
        </div>
      </template>

      <template #body>
        <form @submit.prevent="updateRole" class="space-y-6">
          <!-- Basic Settings -->
          <div class="space-y-4">
            <h4 class="font-medium text-white">Basic Settings</h4>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-300"
                >Role Name</label
              >
              <UInput
                v-model="editForm.name"
                placeholder="Enter role name"
                required
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-300"
                >Role Color</label
              >
              <div class="flex items-center gap-3">
                <input
                  v-model="editForm.color"
                  type="color"
                  class="w-12 h-10 rounded border border-gray-600 bg-dark-700"
                />
                <UInput
                  v-model="editForm.color"
                  placeholder="#99aab5"
                  class="flex-1"
                />
              </div>
            </div>

            <div class="space-y-2">
              <UCheckbox
                v-model="editForm.hoist"
                label="Display role members separately from online members"
              />
              <UCheckbox
                v-model="editForm.mentionable"
                label="Allow anyone to @mention this role"
              />
            </div>
          </div>

          <!-- Permissions -->
          <div class="space-y-4">
            <h4 class="font-medium text-white">Permissions</h4>

            <div
              v-for="category in permissionCategories"
              :key="category.name"
              class="space-y-3"
            >
              <h5
                class="text-sm font-medium text-gray-400 uppercase tracking-wider"
              >
                {{ category.name }}
              </h5>
              <div class="grid grid-cols-1 gap-2">
                <div
                  v-for="permission in category.permissions"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div>
                    <div class="font-medium text-white">
                      {{ permission.name }}
                    </div>
                    <div class="text-sm text-gray-400">
                      {{ permission.description }}
                    </div>
                  </div>
                  <UCheckbox
                    :checked="hasPermission(permission.id, editForm)"
                    @change="togglePermission(permission.id, editForm)"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" color="primary" @click="closeEditModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="updateRole"
            :loading="isLoading"
            :disabled="!editForm.name?.trim()"
          >
            Update Role
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteConfirmOpen">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-trash" class="w-5 h-5 text-red-500" />
          <h3 class="text-lg font-semibold">Delete Role</h3>
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <p class="text-gray-300">
            Are you sure you want to delete the role
            <span class="font-semibold text-white">{{
              roleToDelete?.name
            }}</span
            >?
          </p>
          <p class="text-sm text-gray-400">
            This action cannot be undone. All members with this role will lose
            their permissions.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="outline"
            color="primary"
            @click="isDeleteConfirmOpen = false"
          >
            Cancel
          </UButton>
          <UButton color="error" @click="deleteRole" :loading="isLoading">
            Delete Role
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Drag and Drop Animations */
.role-card {
  transition: all 0.2s ease;
}

.role-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.role-card.dragging {
  opacity: 0.5;
  transform: rotate(1deg);
}

.role-card.drag-over {
  transform: translateY(-2px) scale(1.02);
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Drag handle */
.drag-handle {
  cursor: grab;
  transition: opacity 0.2s ease;
}

.drag-handle:hover {
  opacity: 1 !important;
}

/* Role list vertical layout */
.role-card + .role-card {
  margin-top: 0.5rem;
}
</style>
