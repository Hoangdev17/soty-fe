<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Channel } from "~/stores/channels/channel.type";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();

const memberStore = useMemberStore();
const authStore = useAuthStore();
const route = useRoute();

// Function to refresh members via WebSocket
const refreshMembers = async () => {
  const currentGuildId = route.params.guild_id as string;
  if (currentGuildId) {
    try {
      await memberStore.fetchMembersViaWebSocket(currentGuildId);
    } catch (error) {
      console.error("Failed to refresh members:", error);
    }
  }
};

const emit = defineEmits<{
  toggleMemberPanel: [];
  closeMemberPanel: [];
}>();

const toggleMemberPanel = () => {
  emit("toggleMemberPanel");
};

const closeMemberPanel = () => {
  emit("closeMemberPanel");
};
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
    <!-- Main Voice Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="{ 'mr-[320px]': isOpenSlideoverMember }"
    >
      <!-- Channel Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-mic" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton class="p-1 text-[#b9bbbe] hover:text-white" variant="ghost">
            <UIcon name="i-lucide-settings" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            variant="ghost"
            @click="toggleMemberPanel"
          >
            <UIcon name="i-lucide-users-round" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Voice Channel Content -->
      <div
        class="flex-1 flex flex-col justify-center items-center bg-dark-800 p-8"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-mic"
            class="w-16 h-16 text-[#72767d] mb-4 mx-auto"
          />
          <h2 class="text-white text-2xl font-bold mb-2">
            Kết nối với kênh voice #{{ currentChannel?.name }}
          </h2>
          <p class="text-[#72767d] text-base mb-6">
            Nhấp vào nút dưới đây để tham gia kênh voice.
          </p>
          <UButton
            icon="i-lucide-mic"
            variant="solid"
            color="primary"
            size="lg"
            class="mb-4"
          >
            Tham gia Voice
          </UButton>
          <p class="text-[#72767d] text-sm">
            Hoặc sử dụng phím tắt: Ctrl + Shift + V
          </p>
        </div>

        <!-- Connected Users (placeholder) -->
        <div class="mt-8 w-full max-w-md">
          <h3 class="text-white text-lg font-semibold mb-4">Đang kết nối</h3>
          <div class="space-y-2">
            <!-- Placeholder for connected users -->
            <div class="flex items-center gap-3 p-3 bg-dark-700 rounded-md">
              <UAvatar
                :src="authStore.user?.avatar || undefined"
                :alt="authStore.user?.username"
                size="sm"
                class="flex-shrink-0"
              />
              <div class="flex-1">
                <span class="text-white font-medium">{{
                  authStore.user?.username
                }}</span>
                <span class="text-[#72767d] text-sm ml-2">(Bạn)</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-mic" class="w-4 h-4 text-green-400" />
                <UIcon
                  name="i-lucide-headphones"
                  class="w-4 h-4 text-green-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Members Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenSlideoverMember"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 p-4 overflow-y-auto z-50"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
            Hoạt động —
            {{
              memberStore.getMemberCount(
                (route.params.guild_id as string) || ""
              )
            }}
          </h3>
          <div class="flex items-center gap-2">
            <UButton
              @click="refreshMembers"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
              :loading="memberStore.isLoading"
              size="sm"
            >
              <UIcon name="i-lucide-refresh-ccw" class="w-4 h-4" />
            </UButton>
            <UButton
              @click="closeMemberPanel"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>
        </div>

        <!-- Members List -->
        <div class="space-y-2">
          <div class="text-center text-[#72767d]">
            <UIcon name="i-lucide-users" class="w-12 h-12 mx-auto mb-3" />
            <p>Danh sách thành viên sẽ hiển thị ở đây</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
