<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";
import UnsavedChangesBar from "../atoms/UnsavedChangesBar.vue";

const authStore = useAuthStore();
const user = computed(() => authStore.userInfo);

const state = reactive({
  globalName: "",
  username: "",
});

// Original state để so sánh
const originalState = reactive({
  globalName: "",
  username: "",
});

// Check if there are unsaved changes
const hasChanges = computed(() => {
  return (
    state.globalName !== originalState.globalName ||
    state.username !== originalState.username
  );
});

// Use unsaved changes composable
const { setUnsavedChanges } = useUnsavedChanges();

// Watch changes và update unsaved state
watch(
  hasChanges,
  (value) => {
    setUnsavedChanges(value, "Careful — you have unsaved profile changes!");
  },
  { immediate: true }
);

// Watch user changes và update state
watch(
  user,
  (newUser) => {
    if (newUser) {
      const globalName = newUser.globalName || "";
      const username = newUser.username || "";

      state.globalName = globalName;
      state.username = username;

      // Update original state
      originalState.globalName = globalName;
      originalState.username = username;
    }
  },
  { immediate: true }
);

// Save changes function
const saveChanges = async () => {
  try {
    // TODO: API call to save changes
    console.log("Saving changes:", state);

    // Update original state after successful save
    originalState.globalName = state.globalName;
    originalState.username = state.username;

    // Show success notification
    // TODO: Add notification
  } catch (error) {
    console.error("Failed to save changes:", error);
  }
};

// Reset changes function
const resetChanges = () => {
  state.globalName = originalState.globalName;
  state.username = originalState.username;
};
</script>

<template>
  <div class="pt-1 flex items-start gap-y-4 gap-x-12 p-4 mb-12 w-full">
    <!-- Form Section -->
    <div class="flex flex-col items-start gap-y-4 w-full max-w-md">
      <UFormField label="Global name" class="w-full">
        <UInput
          v-model="state.globalName"
          class="w-full"
          placeholder="Global name"
        />
      </UFormField>
      <USeparator class="w-full" />

      <UFormField label="Username" class="w-full">
        <UInput
          v-model="state.username"
          class="w-full"
          placeholder="Username"
        />
      </UFormField>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">Avatar</p>
      <div class="flex items-center gap-x-2">
        <UButton
          icon="i-lucide-plus"
          label="Change avatar"
          color="primary"
          size="lg"
          class="w-full"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold">DECORATE AVATAR</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-plus"
          label="Decorate avatar"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">AVATAR EFFECT</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-plus"
          label="Avatar effect"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">NAME TAG</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-plus"
          label="Name tag"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">BANNER</p>
      <div class="flex items-center gap-x-2">
        <UButton
          icon="i-lucide-plus"
          label="Change banner"
          color="primary"
          size="lg"
          class="w-full"
        />
        <UButton
          label="Delete banner"
          color="neutral"
          variant="ghost"
          size="lg"
          class="w-full"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">
        PROFILE SUBJECT COLOR
      </p>
      <div class="flex items-center gap-x-3">
        <UPopover>
          <UButton
            :class="`w-[69px] h-[50px] rounded-sm`"
            :style="`background-color: 0x000000`"
            icon="lucide-pencil"
            label="Banner"
            :ui="{
              base: 'relative',
              leadingIcon: 'size-4 absolute right-0 top-0',
              label: 'text-xs font-semibold',
            }"
          />
          <template #content>
            <UColorPicker size="xs" />
          </template>
        </UPopover>

        <UPopover>
          <UButton
            :class="`w-[69px] h-[50px] rounded-sm`"
            :style="`background-color: 0x000000`"
            icon="lucide-pencil"
            label="Accent"
            :ui="{
              base: 'relative',
              leadingIcon: 'size-4 absolute right-0 top-0',
              label: 'text-xs font-semibold',
            }"
          />
          <template #content>
            <UColorPicker size="xs" />
          </template>
        </UPopover>
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">BIOGRAPHY</p>
      <UTextarea
        color="neutral"
        variant="subtle"
        hightlight="true"
        size="xl"
        placeholder="Type something..."
      />
    </div>

    <!-- Preview Card Section -->
    <div class="flex flex-col items-start gap-y-4 w-full max-w-sm">
      <p class="uppercase text-sm font-semibold text-gray-600">PREVIEW</p>

      <!-- Profile Card -->
      <div
        class="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <!-- Banner Section -->
        <div class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div class="absolute inset-0 bg-black opacity-10"></div>
        </div>

        <!-- Avatar Section -->
        <div class="relative px-6 pb-6">
          <div class="flex items-start -mt-12 mb-4">
            <div
              class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-user"
                class="w-8 h-8 text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>

          <!-- Profile Info -->
          <div class="space-y-3">
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ state.globalName || user?.globalName || "Display Name" }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                @{{ state.username || user?.username || "username" }}
              </p>
            </div>

            <!-- Biography -->
            <div class="pt-2">
              <p
                class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
              >
                Your biography will appear here. Add some details about yourself
                to make your profile more interesting!
              </p>
            </div>

            <!-- Profile Stats/Actions -->
            <div
              class="flex items-center gap-x-2 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <UButton
                label="Follow"
                color="primary"
                size="sm"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-message-circle"
                color="neutral"
                variant="outline"
                size="sm"
              />
              <UButton
                icon="i-lucide-more-horizontal"
                color="neutral"
                variant="ghost"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Preview Info -->
      <div
        class="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Profile Elements
        </h3>
        <div class="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Avatar: Default</span>
          </div>
          <div class="flex items-center gap-x-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Banner: Gradient</span>
          </div>
          <div class="flex items-center gap-x-2">
            <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Effects: None</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Unsaved Changes Bar-->
  <UnsavedChangesBar
    :show="hasChanges"
    title="Careful — you have unsaved changes!"
    description="Your changes will be lost if you navigate away."
    @save="saveChanges"
    @reset="resetChanges"
  />
</template>
