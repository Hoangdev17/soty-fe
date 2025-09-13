<script setup lang="ts">
import { useRoute } from "vue-router";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useMessage } from "~/composables/useMessage";

definePageMeta({
  layout: "community-layout",
});

const channelStore = useChannelStore();
const guildStore = useCommunityStore();
const { joinRoom, leaveRoom, fetchMessages, getMessages } = useMessage();

const route = useRoute();
const channelId = route.params.channel_id as string | undefined;
const guildId = route.params.guild_id as string | undefined;
const { currentChannel } = storeToRefs(channelStore);

// Check if there are messages to conditionally show welcome
const hasMessages = computed(() => {
  if (!channelId) return false;
  return getMessages(channelId).length > 0;
});

// MessageList component now handles its own scrolling

onMounted(async () => {
  if (!guildId || !channelId) return;

  // Fetch community data và join Socket.IO room
  await guildStore.fetchCommunityById(guildId);

  // Fetch channel data
  await channelStore.fetchChannelById(guildId, channelId);

  // Fetch existing messages for this channel
  await fetchMessages(channelId);
});

onUnmounted(() => {
  if (channelId) {
    leaveRoom(channelId);
  }
});

// Watch for changes to the currentChannel in the store so the page can react
watch(
  () => channelStore.currentChannel,
  async (newChannel, oldChannel) => {
    try {
      if (!newChannel) return;

      // If channel id changed, fetch messages for the new channel
      if (newChannel.id && newChannel.id !== oldChannel?.id) {
        await fetchMessages(newChannel.id);
      }
    } catch (err) {
      console.error("Error fetching messages for new channel:", err);
    }
  },
  { immediate: false }
);

const isOpenSlideoverMember = ref(false);
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
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
            Hoạt động — 11
          </h3>
          <UButton
            @click="isOpenSlideoverMember = false"
            color="transparent"
            class="text-[#b9bbbe] hover:text-white"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </UButton>
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
