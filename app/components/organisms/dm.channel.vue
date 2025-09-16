<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useMessage } from "~/composables/useMessage";
import type { Channel } from "~/stores/channels/channel.type";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  hasMessages: boolean;
  messageLoading: boolean;
}

const props = defineProps<Props>();

const memberStore = useMemberStore();
const authStore = useAuthStore();
const route = useRoute();

// Reply state
const replyToMessage = ref(null);

// Handle reply from message list
const handleReply = (message: any) => {
  replyToMessage.value = message;
};

// Handle reply sent/cancelled from message input
const handleReplySent = () => {
  replyToMessage.value = null;
};

const handleReplyCancelled = () => {
  replyToMessage.value = null;
};

// Get recipient info for DM
const getRecipient = () => {
  if (!props.currentChannel?.recipients?.length) return null;
  // For DM, recipients array contains user IDs
  // In a real app, you'd fetch user data, but for now we'll show placeholder
  return {
    username: `User ${props.currentChannel.recipients[0]}`,
    avatar: null,
  };
};

const recipient = getRecipient();
</script>

<template>
  <div class="dm-channel-page flex h-full bg-dark-800">
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- DM Header -->
      <div
        class="dm-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UAvatar
            :src="recipient?.avatar"
            :alt="recipient?.username"
            size="sm"
            class="rounded-full"
          />
          <h1 class="text-white font-semibold truncate">
            {{ recipient?.username || "Direct Message" }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-phone" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-video" class="w-5 h-5" />
          </UButton>
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
            <UIcon name="i-lucide-user-plus" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-search" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
          >
            <UIcon name="i-lucide-more-vertical" class="w-5 h-5" />
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
            <UAvatar
              :src="recipient?.avatar"
              :alt="recipient?.username"
              size="lg"
              class="rounded-full mr-3"
            />
          </div>
          <h2 class="text-white text-xl font-bold">
            Đây là nơi bắt đầu cuộc trò chuyện với {{ recipient?.username }}!
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            Học cách sử dụng Discord với {{ recipient?.username }}.
          </p>
        </div>

        <!-- Message list -->
        <MoleculesMessageList
          v-if="hasMessages"
          :roomId="channelId"
          class="flex-1 min-h-0"
          @reply="handleReply"
        />
      </div>

      <!-- Message Input -->
      <div class="message-input-area p-2">
        <div class="max-w-full">
          <MoleculesMessageInput
            :channelId="channelId"
            :replyTo="replyToMessage"
            @reply-sent="handleReplySent"
            @reply-cancelled="handleReplyCancelled"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dm-channel-page {
  color: #dcddde;
  height: 100vh;
  overflow: hidden;
}

.dm-channel-page > .flex-1 {
  min-height: 0;
}
</style>
