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

// Computed để lấy nametag decoration
const nametagDecoration = computed(() => {
  if (!user.value?.nameplateId) return null;

  const decoration = authStore.nameTagDecoration?.find(
    (d) => d.id === user.value?.nameplateId
  );
  return decoration;
});

// Computed để lấy nametag video URL
const nametagVideoUrl = computed(() => {
  if (!nametagDecoration.value) return null;

  // Nameplate videos are in metadata.asset path
  if (nametagDecoration.value.metadata?.asset) {
    return `https://cdn.discordapp.com/assets/collectibles/${nametagDecoration.value.metadata.asset}asset.webm`;
  }

  return null;
});

// Fetch decorations khi component mount
onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      // Fetch avatar decorations
      if (!authStore.decoration?.length && authStore.userInfo?.avatarEffectId) {
        await authStore.fetchAvatarDecorationById(
          authStore.userInfo.avatarEffectId
        );
      }

      // Fetch nametag decorations
      if (authStore.userInfo?.nameplateId) {
        await authStore.fetchNameTagDecorationById(
          authStore.userInfo.nameplateId
        );
      }
    } catch (error) {
    }
  }
});

const onClickMute = () => {
};

const onClickDeafen = () => {
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
    :class="
      nametagVideoUrl || profileEffectUrl ? 'bg-gray-900/90' : 'bg-gray-900/90'
    "
    :style="
      profileEffectUrl && !nametagVideoUrl
        ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${profileEffectUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }
        : {}
    "
  >
    <!-- Nameplate background video cho toàn bộ floating card -->
    <video
      v-if="nametagVideoUrl"
      class="absolute inset-0 w-full h-full object-cover rounded-xl"
      loop
      muted
      autoplay
      playsinline
      :src="nametagVideoUrl"
      style="z-index: 1"
    />

    <!-- Overlay để đảm bảo text dễ đọc khi có nameplate -->
    <div
      v-if="nametagVideoUrl"
      class="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-xl"
      style="z-index: 2"
    ></div>

    <!-- Overlay để đảm bảo text dễ đọc khi có profile effect -->
    <div
      v-else-if="profileEffectUrl"
      class="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
      style="z-index: 2"
    ></div>
    <!-- Avatar + Info -->
    <div class="flex items-center gap-2 relative z-10">
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
        <!-- Username (không cần nameplate riêng vì đã có background) -->
        <h3 class="font-semibold text-sm text-white drop-shadow-lg">
          {{ user?.username }}
        </h3>
        <p class="text-xs text-gray-300">Offline</p>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-1 relative z-10">
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
