<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";
import UnsavedChangesBar from "../atoms/unsave.change.vue";
import UploadButton from "../molecules/upload.button.vue";
import AvatarDecorationModal from "../molecules/avatar.decoration.modal.vue";
import ProfileDecorationModal from "../molecules/profile.decoration.modal.vue";
import NametagDecorationModal from "../molecules/nametag.decoration.modal.vue";
import ProfilePreviewCard from "./profile.preview.card.vue";

const authStore = useAuthStore();
const user = computed(() => authStore.userInfo);

// Get current avatar effect
const currentAvatarEffect = computed(() => {
  if (!user.value?.avatarEffectId) return null;
  return authStore.decoration.find((d) => d.id === user.value?.avatarEffectId);
});

// Get current profile effect
const currentProfileEffect = computed(() => {
  if (!user.value?.profileEffectId) return null;

  const found = authStore.profileDecoration.find((d) => {
    return d.id === user.value?.profileEffectId;
  });

  return found;
});

// Get current nametag
const currentNametag = computed(() => {
  if (!user.value?.nameplateId) return null;
  return authStore.nameTagDecoration.find(
    (d) => d.id === user.value?.nameplateId
  );
});

// Get profile effect style
const profileEffectStyle = computed(() => {
  if (!currentProfileEffect.value?.metadata?.effects) return {};

  const effects = currentProfileEffect.value.metadata.effects;
  const introEffect = effects.find((e: any) => !e.loop);
  const loopEffect = effects.find((e: any) => e.loop);

  if (!introEffect && !loopEffect) return {};

  // Calculate durations
  const introDuration = introEffect?.duration || 0;
  const loopStart = loopEffect?.start || 0;
  const loopDuration = loopEffect?.duration || 0;
  const totalDuration = Math.max(
    introDuration + loopStart + loopDuration,
    8000
  );

  const style: any = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  if (introEffect) {
    style["--intro-src"] = `url(${introEffect.src})`;
    style.backgroundImage = `url(${introEffect.src})`;
  }

  if (loopEffect) {
    style["--loop-src"] = `url(${loopEffect.src})`;
  }

  style.animation = `profile-effect ${totalDuration}ms infinite`;
  style.animationDelay = introEffect ? `${introEffect.start}ms` : "0ms";
  style.animationFillMode = "forwards";

  return style;
});

// Modal state
const isDecorationModalOpen = ref(false);
const isProfileDecorationModalOpen = ref(false);
const isNametagDecorationModalOpen = ref(false);

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

watch(
  () => user.value?.avatarEffectId,
  async (id) => {
    if (!id) return;
    const found = authStore.decoration.find(
      (d: any) => String(d.id) === String(id)
    );
    if (!found) {
      await authStore.fetchAvatarDecorationById(String(id));
    }
  },
  { immediate: true }
);

watch(
  () => user.value?.profileEffectId,
  async (id) => {
    if (!id) return;
    const found = authStore.profileDecoration.find(
      (d: any) => String(d.id) === String(id)
    );
    if (!found) {
      await authStore.fetchProfileDecorationById(String(id));
    }
  },
  { immediate: true }
);

watch(
  () => user.value?.nameplateId,
  async (id) => {
    if (!id) return;
    const found = authStore.nameTagDecoration.find(
      (d: any) => String(d.id) === String(id)
    );
    if (!found) {
      await authStore.fetchNameTagDecorationById(String(id));
    }
  },
  { immediate: true }
);

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
  } catch (error) {
    console.error("Failed to save changes:", error);
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
};

// Avatar decoration methods
const openDecorationModal = () => {
  isDecorationModalOpen.value = true;
};

const handleDecorationUpdated = async (decoration: any) => {
  try {
    await authStore.initializeAuth();
    await authStore.fetchAvatarDecorations();
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
};

// Profile decoration methods
const openProfileDecorationModal = () => {
  isProfileDecorationModalOpen.value = true;
};

const handleProfileDecorationUpdated = async (decoration: any) => {
  try {
    await authStore.initializeAuth();
    await authStore.fetchProfileDecorations();
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
};

// Nametag decoration methods
const openNametagDecorationModal = () => {
  isNametagDecorationModalOpen.value = true;
};

const handleNametagDecorationUpdated = async (decoration: any) => {
  try {
    await authStore.initializeAuth();
    await authStore.fetchNameTagDecorations();
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

      <p class="uppercase text-sm font-semibold w-full">PROFILE EFFECT</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-plus"
          label="Profile effect"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
          @click="openProfileDecorationModal"
        />
      </div>
      <USeparator class="w-full" />

      <p class="uppercase text-sm font-semibold w-full">NAME TAG</p>
      <div class="flex items-center gap-x-2 w-full">
        <UButton
          icon="i-lucide-tag"
          label="Name tag"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center"
          @click="openNametagDecorationModal"
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
    <ProfilePreviewCard
      :key="`${user?.avatarEffectId || 'no-avatar'}-${
        user?.profileEffectId || 'no-profile'
      }`"
      :user="user || undefined"
      :state="{
        avatar: state.avatar || user?.avatar,
        banner: state.banner || user?.banner,
        globalName: state.globalName || user?.globalName,
        username: state.username || user?.username,
        bio: state.bio || user?.bio,
      }"
      :currentProfileEffect="currentProfileEffect || undefined"
      :currentAvatarEffect="currentAvatarEffect || undefined"
      :profileEffectStyle="profileEffectStyle"
    />
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

  <!-- Profile Decoration Modal -->
  <ProfileDecorationModal
    v-model:open="isProfileDecorationModalOpen"
    :user-id="user?.id"
    :current-profile-effect="user?.profileEffectId || undefined"
    @updated="handleProfileDecorationUpdated"
  />

  <!-- Nametag Decoration Modal -->
  <NametagDecorationModal
    v-model:open="isNametagDecorationModalOpen"
    :user-id="user?.id"
    :current-nametag="user?.nameplateId || undefined"
    @updated="handleNametagDecorationUpdated"
  />
</template>

<style scoped>
@keyframes profile-effect {
  0% {
    background-image: var(--intro-src);
  }
  37.5% {
    background-image: var(--intro-src);
  }
  37.6% {
    background-image: var(--loop-src);
  }
  100% {
    background-image: var(--loop-src);
  }
}
</style>
