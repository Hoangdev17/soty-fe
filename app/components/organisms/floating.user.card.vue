<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

const { user, token } = useUserClientStore();
const authStore = useAuthStore();
onMounted(async () => {
  await authStore.setUser(user.value, token.value);
});

const onClickMute = () => {
  console.log("Toggle mute");
};

const onClickDeafen = () => {
  console.log("Toggle deafen");
};

const onClickSettings = () => {
  console.log("Open user settings modal");
};
</script>

<template>
  <div
    class="backdrop-blur-md bg-gray-900/90 text-white shadow-lg rounded-xl p-3 fixed bottom-0 left-0 w-72 flex items-center justify-between z-50"
  >
    <!-- Avatar + Info -->
    <div class="flex items-center gap-2">
      <div class="relative">
        <UAvatar
          :src="user?.avatar"
          alt="avatar"
          class="w-10 h-10 rounded-full border-2 border-gray-700"
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
        color="gray"
        class="hover:bg-gray-700"
        @click="onClickMute"
        title="Toggle Mute"
        icon="i-lucide-mic"
      >
      </UButton>
      <UButton
        size="xs"
        color="gray"
        class="hover:bg-gray-700"
        @click="onClickDeafen"
        title="Toggle Deafen"
        icon="i-lucide-phone"
      >
      </UButton>
      <UButton
        size="xs"
        color="gray"
        class="hover:bg-gray-700"
        @click="onClickSettings"
        title="User Settings"
        icon="i-lucide-settings"
      >
      </UButton>
    </div>
  </div>
</template>
