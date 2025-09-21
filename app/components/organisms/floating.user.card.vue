<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

const authStore = useAuthStore();

// Sử dụng reactive user từ auth store thay vì useUserClientStore
const user = computed(() => authStore.userInfo);
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Computed để lấy avatar effect URL
const avatarEffectUrl = computed(() => {
  if (!user.value?.avatarEffectId) return null;

  const effect = authStore.decoration?.find(
    (d) => d.id === user.value?.avatarEffectId
  );
  return effect?.metadata?.link || effect?.metadata?.image || null;
});

// Computed để lấy profile effect URL
const profileEffectUrl = computed(() => {
  if (!user.value?.profileEffectId) return null;

  const effect = authStore.profileDecoration?.find(
    (d) => d.id === user.value?.profileEffectId
  );
  return effect?.metadata?.link || effect?.metadata?.image || null;
});

// Fetch profile decorations khi component mount
onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.decoration?.length) {
    try {
      await authStore.fetchAvatarDecorations();
    } catch (error) {
      console.error("Failed to fetch avatar decorations:", error);
    }
  }
});

const onClickMute = () => {
  console.log("Toggle mute");
};

const onClickDeafen = () => {
  console.log("Toggle deafen");
};

const onClickSettings = () => {
  if (user.value?.username) {
    navigateTo("/settings/@" + user.value.username);
  }
};
</script>

<template>
  <div
    v-if="isLoggedIn && user"
    class="backdrop-blur-md text-white shadow-lg rounded-xl p-3 fixed bottom-0 left-0 w-72 flex items-center justify-between z-50 transition-all duration-300 overflow-hidden"
    :class="profileEffectUrl ? 'bg-gray-900/90' : 'bg-gray-900/90'"
    :style="
      profileEffectUrl
        ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${profileEffectUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }
        : {}
    "
  >
    <!-- Overlay để đảm bảo text dễ đọc -->
    <div
      v-if="profileEffectUrl"
      class="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
    ></div>
    <!-- Avatar + Info -->
    <div class="flex items-center gap-2">
      <div class="relative w-10 h-10">
        <!-- Avatar -->
        <UAvatar
          :src="user?.avatar || undefined"
          :alt="user?.username || 'avatar'"
          class="w-10 h-10 rounded-full border-2 border-gray-700 relative z-10"
        />

        <!-- Avatar Effect Overlay (đè lên trên avatar) -->
        <img
          v-if="avatarEffectUrl"
          :src="avatarEffectUrl"
          class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-20"
          alt="Avatar effect"
        />
      </div>

      <div>
        <h3 class="font-semibold text-sm">{{ user?.username }}</h3>
        <p class="text-xs text-gray-400">Offline</p>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-1">
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="hover:bg-gray-700"
        @click="onClickMute"
        title="Toggle Mute"
        icon="i-lucide-mic"
      >
      </UButton>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="hover:bg-gray-700"
        @click="onClickDeafen"
        title="Toggle Deafen"
        icon="i-lucide-phone"
      >
      </UButton>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="hover:bg-gray-700"
        @click="onClickSettings"
        title="User Settings"
        icon="i-lucide-settings"
      >
      </UButton>
    </div>
  </div>
</template>
