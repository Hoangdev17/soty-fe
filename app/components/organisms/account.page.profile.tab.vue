<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";
import UnsavedChangesBar from "../atoms/unsave.change.vue";
import UploadButton from "../molecules/upload.button.vue";
import AvatarDecorationModal from "../molecules/avatar.decoration.modal.vue";

const authStore = useAuthStore();
const user = computed(() => authStore.userInfo);

// Get current avatar effect
const currentAvatarEffect = computed(() => {
  if (!user.value?.avatarEffectId) return null;
  return authStore.decoration.find((d) => d.id === user.value?.avatarEffectId);
});

// Modal state
const isDecorationModalOpen = ref(false);

const state = reactive({
  globalName: "",
  username: "",
  avatar: "",
  banner: "",
  bio: "",
});

// Original state để so sánh
const originalState = reactive({
  globalName: "",
  username: "",
  avatar: "",
  banner: "",
  bio: "",
});

// Check if there are unsaved changes
const hasChanges = computed(() => {
  return (
    state.globalName !== originalState.globalName ||
    state.username !== originalState.username ||
    state.avatar !== originalState.avatar ||
    state.banner !== originalState.banner ||
    state.bio !== originalState.bio
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
      const avatar = newUser.avatar || "";
      const banner = newUser.banner || "";
      const bio = newUser.bio || "";

      state.globalName = globalName;
      state.username = username;
      state.avatar = avatar;
      state.banner = banner;
      state.bio = bio;

      // Update original state
      originalState.globalName = globalName;
      originalState.username = username;
      originalState.avatar = avatar;
      originalState.banner = banner;
      originalState.bio = bio;
    }
  },
  { immediate: true }
);

// Load avatar decorations on mount
onMounted(async () => {
  try {
    await authStore.fetchAvatarDecorations();
  } catch (error) {
    console.error("Failed to load avatar decorations:", error);
  }
});

// Save changes function
const saveChanges = async () => {
  try {
    await authStore.updateUserProfile({
      globalName: state.globalName,
      username: state.username,
      avatar: state.avatar,
      banner: state.banner,
      bio: state.bio,
    });

    // Update original state after successful save
    originalState.globalName = state.globalName;
    originalState.username = state.username;
    originalState.avatar = state.avatar;
    originalState.banner = state.banner;
    originalState.bio = state.bio;

    // Show success notification
    // TODO: Add notification
  } catch (error) {
    console.error("Failed to save changes:", error);
    // TODO: Add error notification
  }
};

// Reset changes function
const resetChanges = () => {
  state.globalName = originalState.globalName;
  state.username = originalState.username;
  state.avatar = originalState.avatar;
  state.banner = originalState.banner;
  state.bio = originalState.bio;
};

// Upload handlers
const handleAvatarUploadSuccess = (url: string) => {
  state.avatar = url;
};

const handleBannerUploadSuccess = (url: string) => {
  state.banner = url;
};

const handleUploadError = (error: string) => {
  console.error("Upload failed:", error);
  // TODO: Add error notification
};

// Avatar decoration methods
const openDecorationModal = () => {
  isDecorationModalOpen.value = true;
};

const handleDecorationUpdated = async (decoration: any) => {
  console.log("Avatar decoration updated:", decoration);
  // Refresh user data to get updated avatar effect
  try {
    await authStore.initializeAuth();
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
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
        <UploadButton
          button-text="Change avatar"
          accept="image/*"
          :max-size="2"
          @success="handleAvatarUploadSuccess"
          @error="handleUploadError"
          class="w-full"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold">DECORATE AVATAR</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-palette"
          label="Decorate avatar"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
          @click="openDecorationModal"
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
        <UploadButton
          button-text="Change banner"
          accept="image/*"
          :max-size="5"
          @success="handleBannerUploadSuccess"
          @error="handleUploadError"
          class="w-full"
        />
        <UButton
          label="Delete banner"
          color="neutral"
          variant="ghost"
          size="lg"
          class="w-full"
          @click="state.banner = ''"
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
        v-model="state.bio"
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
        class="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <!-- Banner Section -->
        <div class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div class="absolute inset-0 bg-black opacity-10"></div>
          <img
            v-if="state.banner"
            :src="state.banner"
            alt="Banner"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Avatar Section -->
        <div class="relative px-6 pb-6">
          <div class="flex items-start -mt-12 mb-4">
            <!-- Avatar Container -->
            <div class="relative w-20 h-20 flex items-center justify-center">
              <!-- Avatar -->
              <div
                class="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 overflow-hidden"
              >
                <img
                  v-if="state.avatar"
                  :src="state.avatar"
                  :alt="state.globalName || user?.globalName || 'Avatar'"
                  class="w-full h-full object-cover"
                />
                <UIcon
                  v-else
                  name="i-lucide-user"
                  class="w-8 h-8 text-gray-500 dark:text-gray-400"
                />
              </div>

              <!-- Avatar Effect Overlay (căn giữa & ra ngoài border) -->
              <img
                v-if="currentAvatarEffect?.metadata?.link"
                :src="currentAvatarEffect.metadata.link"
                class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-10"
                alt="Avatar effect"
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
                {{
                  state.bio ||
                  "Your biography will appear here. Add some details about yourself to make your profile more interesting!"
                }}
              </p>
            </div>
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

  <!-- Avatar Decoration Modal -->
  <AvatarDecorationModal
    v-model:open="isDecorationModalOpen"
    :user-id="user?.id"
    :current-avatar="user?.avatar || undefined"
    @updated="handleDecorationUpdated"
  />
</template>
