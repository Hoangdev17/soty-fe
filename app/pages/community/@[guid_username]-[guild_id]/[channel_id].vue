<script setup lang="ts">
import { useRoute } from "vue-router";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useMessage } from "~/composables/useMessage";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import ChannelLoading from "~/components/organisms/channel.loading.vue";

definePageMeta({
  layout: "community-layout",
});

const channelStore = useChannelStore();
const guildStore = useCommunityStore();
const memberStore = useMemberStore();
const authStore = useAuthStore();
const { joinRoom, leaveRoom, fetchMessages, getMessages } = useMessage();

const route = useRoute();
const channelId = route.params.channel_id as string | undefined;
const guildId = route.params.guild_id as string | undefined;
const { currentChannel } = storeToRefs(channelStore);

const isPageLoading = ref(true);

const messageLoading = ref(false);

// Flag để tránh multiple fetch community
const isFetchingCommunity = ref(false);

// Check if there are messages to conditionally show welcome
const hasMessages = computed(() => {
  if (!channelId) return false;
  return getMessages(channelId).length > 0;
});

onMounted(async () => {
  if (!guildId || !channelId) return;

  await guildStore.fetchCommunityById(guildId);
  await channelStore.fetchChannelById(guildId, channelId);

  // Always fetch members for the current guild
  await memberStore.fetchMembersViaWebSocket(guildId);

  // Fetch existing messages for this channel
  await fetchMessages(channelId);
  messageLoading.value = false;
  isPageLoading.value = false;
});

// Watch for route parameter changes to reset stores when switching communities/channels
watch(
  () => route.params.guild_id,
  async (newGuildId, oldGuildId) => {
    if (newGuildId && newGuildId !== oldGuildId) {
      // Tránh multiple fetch cùng lúc
      if (isFetchingCommunity.value) {
        console.log(`⏳ Channel Page: Already fetching community, skipping...`);
        return;
      }
      isFetchingCommunity.value = true;

      // Reset loading state
      isPageLoading.value = true;
      messageLoading.value = true;

      try {
        // Fetch new community data (this will also reset stores)
        await guildStore.fetchCommunityById(newGuildId as string);

        // Fetch members for new community
        await memberStore.fetchMembersViaWebSocket(newGuildId as string);
      } finally {
        // Reset flag sau khi fetch xong
        isFetchingCommunity.value = false;
        isPageLoading.value = false;
      }
    }
  }
); // Watch for route parameter changes to reset stores when switching communities/channels
watch(
  () => route.params.guild_id,
  async (newGuildId, oldGuildId) => {
    if (newGuildId && newGuildId !== oldGuildId) {
      // Reset loading state
      isPageLoading.value = true;
      messageLoading.value = true;

      // Fetch new community data (this will also reset stores)
      await guildStore.fetchCommunityById(newGuildId as string);

      // Fetch members for new community
      await memberStore.fetchMembersViaWebSocket(newGuildId as string);

      isPageLoading.value = false;
    }
  }
);

watch(
  () => route.params.channel_id,
  async (newChannelId, oldChannelId) => {
    if (newChannelId && newChannelId !== oldChannelId) {
      // Reset loading state
      messageLoading.value = true;

      // Get current guildId from route params (not the old variable)
      const currentGuildId = route.params.guild_id as string;

      // Fetch new channel data
      if (currentGuildId) {
        await channelStore.fetchChannelById(
          currentGuildId,
          newChannelId as string
        );
      }

      // Fetch messages for new channel
      await fetchMessages(newChannelId as string);

      messageLoading.value = false;
    }
  }
);

onUnmounted(() => {
  if (channelId) {
    leaveRoom(`channel_${channelId}`);
  }
  if (guildId) {
    leaveRoom(`community_${guildId}`);
  }
});

// Watch for changes to the currentChannel in the store so the page can react
watch(
  () => channelStore.currentChannel,
  async (newChannel, oldChannel) => {
    try {
      if (!newChannel) return;

      // If channel id changed and it's not the initial load, fetch messages for the new channel
      if (
        newChannel.id &&
        newChannel.id !== oldChannel?.id &&
        oldChannel !== undefined
      ) {
        await fetchMessages(newChannel.id);
      }
    } catch (err) {
      console.error("Error fetching messages for new channel:", err);
    }
  },
  { immediate: false }
);

const isOpenSlideoverMember = ref(false);

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
</script>

<template>
  <ChannelLoading v-if="isPageLoading" />
  <div v-else class="channel-page flex h-full bg-dark-800">
    <!-- Main Chat Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="{ 'mr-[320px]': isOpenSlideoverMember }"
    >
      <!-- Channel Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-hash" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold">{{ currentChannel?.name }}</h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-pin" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-spool" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
            @click="isOpenSlideoverMember = !isOpenSlideoverMember"
          >
            <UIcon name="i-lucide-users-round" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="flex-1 flex flex-col justify-end min-h-0 bg-dark-800">
        <!-- Welcome message -->
        <AtomsMessageLoading v-if="messageLoading" />
        <div
          v-if="!hasMessages"
          class="flex flex-col items-start text-left p-4"
        >
          <div class="flex items-center mb-4">
            <UIcon name="i-lucide-hash" class="w-8 h-8 text-[#72767d] mr-3" />
          </div>
          <h2 class="text-white text-xl font-bold">
            Chào mừng đến với kênh #{{ currentChannel?.name }}!
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            Đây là nơi bắt đầu của kênh #{{ currentChannel?.name }}.
          </p>
          <UButton icon="i-lucide-pencil" variant="ghost" color="info">
            Chỉnh sửa kênh
          </UButton>
        </div>

        <!-- Message list - takes remaining space and handles its own scrolling -->
        <MoleculesMessageList
          v-if="hasMessages"
          :roomId="channelId || ''"
          class="flex-1 min-h-0"
        />
      </div>

      <div class="message-input-area p-2">
        <div class="max-w-full">
          <MoleculesMessageInput :channelId="channelId || ''" />
        </div>
      </div>
      <!-- Message Input -->
    </div>

    <!-- Members Panel - Fixed position on the right -->
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
              color="transparent"
              class="text-[#b9bbbe] hover:text-white p-1"
              :loading="memberStore.isLoading"
              size="sm"
            >
              <UIcon name="i-lucide-refresh-ccw" class="w-4 h-4" />
            </UButton>
            <UButton
              @click="isOpenSlideoverMember = false"
              color="transparent"
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

<style scoped>
.channel-page {
  color: #dcddde;
  /* Make the chat page fill the viewport and prevent the page itself from scrolling */
  height: 100vh;
  overflow: hidden;
}

.mention {
  background-color: rgba(88, 101, 242, 0.3);
  padding: 0 2px;
  border-radius: 3px;
}

.message-group:hover {
  background-color: #32353b;
}

.reaction:hover {
  background-color: #40444b;
}

.input-wrapper input:focus {
  outline: none;
}

.username.text-\[#00d4aa\] {
  color: #00d4aa;
}

.username.text-\[#ed4245\] {
  color: #ed4245;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Ensure the immediate flex child can shrink so inner flex children can scroll */
.channel-page > .flex-1 {
  min-height: 0;
}
</style>
