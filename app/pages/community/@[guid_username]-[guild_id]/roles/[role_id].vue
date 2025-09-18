<script setup lang="ts">
import { useRoleStore } from "~/stores/roles/role.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useUnsavedChanges } from "~/composables/useUnsavedChanges";
import type {
  Role,
  UpdateRoleData,
  Permission,
} from "~/stores/roles/role.type";
import RoleIcon from "~/components/atoms/role.icon.vue";
import UnsavedChangesBar from "~/components/atoms/unsave.change.vue";

const route = useRoute();
const router = useRouter();
const roleStore = useRoleStore();
const communityStore = useCommunityStore();

const guildId = route.params.guild_id as string;
const roleId = route.params.role_id as string;
const guildUsername = route.params.guid_username as string;

definePageMeta({
  middleware: ["required-auth"],
  beforeRouteLeave: (to: any, from: any, next: any) => {
    if (hasUnsavedChanges.value) {
      const confirmLeave = confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?"
      );
      if (confirmLeave) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  },
});

// Reactive refs
const isLoading = ref(true);
const error = ref("");
const isSaving = ref(false);
const originalRole = ref<Role | null>(null);

// Unsaved changes logic
const { hasUnsavedChanges, setUnsavedChanges } = useUnsavedChanges();

// Form data
const formData = reactive<UpdateRoleData>({
  name: "",
  color: "#99aab5",
  hoist: false,
  mentionable: true,
  permissions: [],
});

// Predefined color options for role color picker
const colorOptions = [
  "#99aab5", // Default gray
  "#1abc9c", // Teal
  "#2ecc71", // Green
  "#3498db", // Blue
  "#9b59b6", // Purple
  "#e91e63", // Pink
  "#f1c40f", // Yellow
  "#e67e22", // Orange
  "#e74c3c", // Red
  "#95a5a6", // Gray
  "#34495e", // Dark gray
  "#7289da", // Discord blurple
  "#43b581", // Discord green
  "#faa61a", // Discord gold
  "#f04747", // Discord red
  "#ffffff", // White
];

// Computed
const role = computed(() => roleStore.getRoleById(guildId, roleId));
const currentCommunity = computed(() => communityStore.currentCommunity);

// Permission categories
const permissionCategories = computed(() => {
  const categoryMapping = {
    "General Server Management": "general",
    "Text Channel Management": "text",
    "Voice Channel Management": "voice",
    "Membership Management": "management",
    Administrative: "administrative",
  };

  const result = Object.entries(categoryMapping).map(
    ([displayName, categoryKey]) => ({
      name: displayName,
      permissions: roleStore.getPermissionsByCategory(categoryKey),
    })
  );

  // Debug: log to see if permissions are loaded
  console.log("Permission categories:", result);
  console.log("All permissions:", roleStore.getAllPermissions);

  return result;
});

// Methods
const closeRoleEdit = () => {
  if (hasUnsavedChanges.value) {
    const confirmClose = confirm(
      "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng role edit?"
    );
    if (!confirmClose) return;
  }
  router.push(`/community/@${guildUsername}-${guildId}/roles`);
};

const loadRole = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    // Fetch roles if not already loaded
    if (!roleStore.getRolesByGuild(guildId).length) {
      await roleStore.fetchRoles(guildId);
    }

    const currentRole = roleStore.getRoleById(guildId, roleId);
    if (!currentRole) {
      error.value = "Role not found";
      return;
    }

    // Initialize form data
    formData.name = currentRole.name;
    formData.color = currentRole.color;
    formData.hoist = currentRole.hoist;
    formData.mentionable = currentRole.mentionable;
    formData.permissions = [...currentRole.permissions];

    // Store original data for comparison
    originalRole.value = { ...currentRole };
  } catch (err) {
    console.error("Failed to load role:", err);
    error.value = "Failed to load role";
  } finally {
    isLoading.value = false;
  }
};

const saveRole = async () => {
  if (!formData.name?.trim()) {
    error.value = "Role name is required";
    return;
  }

  try {
    isSaving.value = true;
    error.value = "";

    // Prepare update data with color saved to icon field
    const updateData = {
      ...formData,
      icon: formData.color, // Save color to icon field
    };

    await roleStore.updateRole(guildId, roleId, updateData);

    // Update original data after successful save
    if (originalRole.value) {
      originalRole.value.name = formData.name || "";
      originalRole.value.color = formData.color || "#99aab5";
      originalRole.value.hoist = formData.hoist || false;
      originalRole.value.mentionable = formData.mentionable || true;
      originalRole.value.permissions = [...(formData.permissions || [])];
    }

    setUnsavedChanges(false);

    // Navigate back to roles list
    closeRoleEdit();
  } catch (err) {
    console.error("Failed to save role:", err);
    error.value = "Failed to save role";
  } finally {
    isSaving.value = false;
  }
};

const togglePermission = (permission: Permission) => {
  if (!formData.permissions) {
    formData.permissions = [];
  }

  const index = formData.permissions.findIndex((id) => id === permission.id);
  if (index > -1) {
    formData.permissions.splice(index, 1);
  } else {
    formData.permissions.push(permission.id);
  }
};

const hasPermission = (permission: Permission) => {
  if (!formData.permissions) return false;
  return formData.permissions.includes(permission.id);
};

const resetChanges = () => {
  if (!originalRole.value) return;

  formData.name = originalRole.value.name;
  formData.color = originalRole.value.color;
  formData.hoist = originalRole.value.hoist;
  formData.mentionable = originalRole.value.mentionable;
  formData.permissions = [...originalRole.value.permissions];

  setUnsavedChanges(false);
};

// Watch for form changes to detect unsaved changes
watch(
  formData,
  (newData) => {
    if (!originalRole.value) return;

    const hasChanges =
      newData.name !== originalRole.value.name ||
      newData.color !== originalRole.value.color ||
      newData.hoist !== originalRole.value.hoist ||
      newData.mentionable !== originalRole.value.mentionable ||
      JSON.stringify(newData.permissions?.sort()) !==
        JSON.stringify(originalRole.value.permissions?.sort());

    setUnsavedChanges(
      hasChanges,
      "Bạn có thay đổi chưa lưu trong role settings!"
    );
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  loadRole();
});
</script>

<template>
  <div class="flex items-start size-full bg-dark-900">
    <!-- Sidebar -->
    <OrganismsSidebarSettingCommunity />

    <!-- Main Content -->
    <div
      class="w-full max-w-4xl mx-auto p-6 overflow-y-auto overflow-x-hidden relative bg-dark-900"
    >
      <!-- Close button (fixed position) -->
      <div class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1">
        <UButton
          @click="closeRoleEdit"
          class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors flex items-center justify-center border border-dark-600"
          title="Đóng Role Edit"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4 text-white" />
        </UButton>
        <span class="text-xs text-gray-400 font-medium">ESC</span>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <UButton
            @click="closeRoleEdit"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            class="h-10 w-10"
          />
          <div>
            <h2 class="text-2xl font-bold text-white">Edit Role</h2>
            <p class="text-gray-400 mt-1">
              Configure permissions and settings for this role
            </p>
          </div>
        </div>
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
          <span class="text-gray-400">Loading role...</span>
        </div>
      </div>

      <!-- Role Edit Form -->
      <div v-else class="space-y-6">
        <!-- Basic Settings -->
        <UCard class="bg-dark-800 border-dark-700">
          <div class="flex items-center gap-3 mb-4">
            <RoleIcon :role-id="roleId" class="w-6 h-6" />
            <h3 class="text-lg font-semibold text-white">Role Settings</h3>
          </div>

          <div class="space-y-4">
            <!-- Role Name -->
            <UFormField label="Role Name" class="w-full">
              <UInput
                v-model="formData.name"
                placeholder="Enter role name"
                class="w-full"
              />
            </UFormField>

            <!-- Role Color -->
            <UFormField label="Role Color" class="w-full">
              <div class="space-y-3">
                <!-- Current Color Display -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full border-2 border-gray-300"
                    :style="{ backgroundColor: formData.color }"
                  ></div>
                  <span class="text-white font-mono text-sm">{{
                    formData.color
                  }}</span>
                </div>

                <!-- Color Picker Grid -->
                <div class="grid grid-cols-8 gap-2">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                    :class="[
                      formData.color === color
                        ? 'border-white ring-2 ring-blue-500'
                        : 'border-gray-400 hover:border-white',
                    ]"
                    :style="{ backgroundColor: color }"
                    @click="formData.color = color"
                    :title="color"
                  />
                </div>

                <!-- Custom Color Input -->
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-400">Custom:</label>
                  <input
                    v-model="formData.color"
                    type="color"
                    class="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <UInput
                    v-model="formData.color"
                    placeholder="#ffffff"
                    class="flex-1 max-w-32 text-xs"
                  />
                </div>
              </div>
            </UFormField>

            <!-- Role Switches -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-white font-medium">
                    Display role members separately from online members
                  </p>
                  <p class="text-sm text-gray-400">
                    Members with this role will appear in a separate section
                  </p>
                </div>
                <USwitch v-model="formData.hoist" />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-white font-medium">
                    Allow anyone to @mention this role
                  </p>
                  <p class="text-sm text-gray-400">
                    Members can mention this role in messages
                  </p>
                </div>
                <USwitch v-model="formData.mentionable" />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Permissions -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white mb-4">Permissions</h3>

          <div
            v-for="category in permissionCategories"
            :key="category.name"
            class="space-y-3"
          >
            <UCard class="bg-dark-800 border-dark-700">
              <template #header>
                <div class="flex items-center justify-between">
                  <h4 class="text-base font-semibold text-white">
                    {{ category.name }}
                  </h4>
                  <span
                    class="text-xs text-gray-400 bg-dark-700 px-2 py-1 rounded"
                  >
                    {{ category.permissions.length }} permissions
                  </span>
                </div>
              </template>

              <div
                v-if="category.permissions.length === 0"
                class="text-gray-500 text-sm py-4"
              >
                No permissions in this category
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="permission in category.permissions"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                >
                  <div class="flex-1">
                    <p class="text-white font-medium">{{ permission.name }}</p>
                    <p class="text-sm text-gray-400 mt-1">
                      {{ permission.description }}
                    </p>
                  </div>
                  <USwitch
                    :model-value="hasPermission(permission)"
                    @update:model-value="togglePermission(permission)"
                    class="ml-4"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Unsaved Changes Bar -->
    <UnsavedChangesBar
      :show="hasUnsavedChanges"
      title="Cẩn thận — bạn có thay đổi chưa lưu!"
      save-label="Lưu Thay Đổi"
      reset-label="Đặt lại"
      @save="saveRole"
      @reset="resetChanges"
    />
  </div>
</template>
