<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";
import { useChannelStore } from "~/stores/channels/channel.store";
import { leaveRoom } from "~/stores/websocket/websocket.action";

interface Props {
  threadId: string;
}

const props = defineProps<Props>();
const channelStore = useChannelStore();

const route = useRoute();
const { getThread, fetchThread, getMessages, joinRoom } = useMessage();

// Thread data
const thread = computed(() => getThread(props.threadId));
const channelId = channelStore.currentChannel?.id;

// Thread messages
const threadMessages = computed(() => getMessages(props.threadId));

// Reply state
const replyToMessage = ref(null);

// Load thread data when threadId changes
watch(
  () => props.threadId,
  async (newThreadId) => {
    if (newThreadId && channelId) {
      await fetchThread(channelId, newThreadId);
      joinRoom(newThreadId);
    }
  },
  { immediate: true }
);

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

// Leave thread room when component unmounts
onBeforeUnmount(() => {
  if (props.threadId) {
    leaveRoom(props.threadId);
  }
});
</script>

<template>
  <div class="thread-channel flex h-full bg-dark-800">
    <!-- Main Thread Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Thread Header -->
      <div
        class="thread-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon
            name="i-lucide-message-circle"
            class="w-5 h-5 text-[#b9bbbe]"
          />
          <div>
            <h1 class="text-white font-semibold truncate">
              {{ thread?.name || "Thread" }}
            </h1>
            <p class="text-gray-400 text-xs">
              {{ threadMessages.length }} tin nhắn
            </p>
          </div>
        </div>
      </div>

      <!-- Thread Messages Container -->
      <div class="flex-1 flex flex-col justify-end min-h-0 bg-dark-800">
        <!-- Thread starter message -->
        <div v-if="thread" class="p-4 border-b border-dark-700">
          <div class="flex items-start gap-3">
            <UAvatar
              :src="thread.createdBy.avatar"
              :alt="thread.createdBy.username"
              size="md"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold text-white">{{
                  thread.createdBy.username
                }}</span>
                <span class="text-xs text-gray-400">
                  {{ new Date(thread.createdAt).toLocaleDateString("vi-VN") }}
                </span>
              </div>
              <div class="text-white mb-2">{{ thread.name }}</div>
              <div v-if="thread.topic" class="text-gray-300 text-sm">
                {{ thread.topic }}
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <MoleculesMessageList
          :roomId="threadId"
          class="flex-1 min-h-0"
          @reply="handleReply"
        />
      </div>

      <!-- Message Input -->
      <div class="message-input-area p-4 border-t border-dark-700">
        <MoleculesMessageInput
          :channelId="threadId"
          :replyTo="replyToMessage"
          @reply-sent="handleReplySent"
          @reply-cancelled="handleReplyCancelled"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.thread-channel {
  color: #dcddde;
  height: 100vh;
  overflow: hidden;
}

.message-group:hover {
  background-color: #32353b;
}

/* Ensure the immediate flex child can shrink so inner flex children can scroll */
.thread-channel > .flex-1 {
  min-height: 0;
}
</style>
