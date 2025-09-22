<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Channel } from "~/stores/channels/channel.type";
import { useBreakpoint } from "~/composables/useBreakpoint.client";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();

const { isMobile } = useBreakpoint();

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
    <!-- Desktop Seminar Area -->
    <div
      v-if="!isMobile"
      class="flex-1 flex flex-col transition-all duration-300"
      :class="{ 'mr-[320px]': isOpenSlideoverMember }"
    >
      <!-- Channel Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-presentation" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton class="p-1 text-[#b9bbbe] hover:text-white" variant="ghost">
            <UIcon name="i-lucide-monitor-speaker" class="w-5 h-5" />
          </UButton>
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

      <!-- Seminar Channel Content -->
      <div
        class="flex-1 flex flex-col justify-center items-center bg-dark-800 p-8"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-presentation"
            class="w-16 h-16 text-[#72767d] mb-4 mx-auto"
          />
          <h2 class="text-white text-2xl font-bold mb-2">
            Tham gia Seminar #{{ currentChannel?.name }}
          </h2>
          <p class="text-[#72767d] text-base mb-6">
            Kết nối để tham gia buổi seminar với voice và screen sharing.
          </p>
          <div class="flex gap-4 justify-center mb-4">
            <UButton
              icon="i-lucide-mic"
              variant="solid"
              color="primary"
              size="lg"
            >
              Tham gia Voice
            </UButton>
            <UButton
              icon="i-lucide-monitor-speaker"
              variant="outline"
              size="lg"
            >
              Chia sẻ Màn hình
            </UButton>
          </div>
          <p class="text-[#72767d] text-sm">
            Hoặc sử dụng phím tắt: Ctrl + Shift + S
          </p>
        </div>

        <!-- Connected Users (placeholder) -->
        <div class="mt-8 w-full max-w-md">
          <h3 class="text-white text-lg font-semibold mb-4">Đang tham gia</h3>
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
                  name="i-lucide-monitor-speaker"
                  class="w-4 h-4 text-blue-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Seminar Layout -->
    <div v-else class="flex flex-col h-full bg-dark-800">
      <!-- Mobile Channel Header -->
      <div
        class="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-presentation" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            variant="ghost"
            @click="toggleMemberPanel"
          >
            <UIcon name="i-lucide-users-round" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Mobile Seminar Content -->
      <div
        class="flex-1 flex flex-col justify-center items-center bg-dark-800 p-4"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-presentation"
            class="w-12 h-12 text-[#72767d] mb-3 mx-auto"
          />
          <h2 class="text-white text-xl font-bold mb-2">
            Tham gia Seminar #{{ currentChannel?.name }}
          </h2>
          <p class="text-[#72767d] text-sm mb-4">
            Kết nối để tham gia buổi seminar với voice và screen sharing.
          </p>
          <div class="flex flex-col gap-3 mb-4">
            <UButton
              icon="i-lucide-mic"
              variant="solid"
              color="primary"
              size="lg"
              class="w-full"
            >
              Tham gia Voice
            </UButton>
            <UButton
              icon="i-lucide-monitor-speaker"
              variant="outline"
              size="lg"
              class="w-full"
            >
              Chia sẻ Màn hình
            </UButton>
          </div>
          <p class="text-[#72767d] text-xs">
            Hoặc sử dụng phím tắt: Ctrl + Shift + S
          </p>
        </div>

        <!-- Connected Users Mobile -->
        <div class="mt-6 w-full max-w-sm">
          <h3 class="text-white text-base font-semibold mb-3">Đang tham gia</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-3 p-3 bg-dark-700 rounded-md">
              <UAvatar
                :src="authStore.user?.avatar || undefined"
                :alt="authStore.user?.username"
                size="sm"
                class="flex-shrink-0"
              />
              <div class="flex-1">
                <span class="text-white font-medium text-sm">{{
                  authStore.user?.username
                }}</span>
                <span class="text-[#72767d] text-xs ml-2">(Bạn)</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-mic" class="w-4 h-4 text-green-400" />
                <UIcon
                  name="i-lucide-monitor-speaker"
                  class="w-4 h-4 text-blue-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Members Modal for Mobile -->
      <UModal
        :open="isOpenSlideoverMember"
        @update:open="closeMemberPanel"
        class="w-full h-full"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-white font-semibold flex items-center text-lg">
              <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
              Hoạt động —
              {{
                memberStore.getMemberCount(
                  (route.params.guild_id as string) || ""
                )
              }}
            </h3>
            <UButton
              @click="closeMemberPanel"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>
        </template>

        <template #body>
          <div class="text-center text-[#72767d]">
            <UIcon name="i-lucide-users" class="w-12 h-12 mx-auto mb-3" />
            <p>Danh sách thành viên sẽ hiển thị ở đây</p>
          </div>
        </template>
      </UModal>
    </div>

    <!-- Desktop Members Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenSlideoverMember && !isMobile"
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
          <div v-if="memberStore.isLoading" class="text-center py-4">
            <UIcon
              name="i-lucide-loader-2"
              class="w-6 h-6 animate-spin mx-auto text-gray-400"
            />
            <p class="text-gray-400 text-sm mt-2">Đang tải...</p>
          </div>

          <div v-else-if="memberStore.getError" class="text-center py-4">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-6 h-6 mx-auto text-red-400"
            />
            <p class="text-red-400 text-sm mt-2">{{ memberStore.getError }}</p>
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="member in memberStore.getMembersByGuild(route.params.guild_id as string || '')"
              :key="member.id"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-dark-700 transition-colors"
            >
              <UAvatar
                :src="member.avatar"
                :alt="member.nickname || member.user?.username"
                size="sm"
                class="flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-white font-medium text-sm truncate">
                    {{ member.nickname || member.user?.username }}
                  </span>
                  <span
                    v-if="member.user?.id === authStore.user?.id"
                    class="text-xs text-green-400 font-medium"
                  >
                    Bạn
                  </span>
                </div>
                <div class="flex items-center gap-1 text-xs text-gray-400">
                  <UIcon
                    name="i-lucide-crown"
                    v-if="member.permissions?.includes('ADMIN')"
                    class="w-3 h-3 text-yellow-400"
                  />
                  <span>{{ member.user?.username }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
