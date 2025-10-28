<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMessage } from "~/composables/useMessage";
import type { Message } from "~/stores/message/message.type";
import { joinRoom } from "~/stores/websocket/websocket.action";

interface Props {
  threadId: string;
  isOpen: boolean;
  channelId?: string;
}

const props = defineProps<Props>();
const route = useRoute();

const { getThread, fetchThread, getMessages, fetchMessages } = useMessage();

// Thread data
const thread = computed(() => getThread(props.threadId));
const channelId = props.channelId || (route.params.channel_id as string);

// Get messages for this thread
const threadMessages = computed(() => getMessages(props.threadId));

// Reply state for thread
const replyToMessage = ref<Message | null>(null);

// Load thread data when opened
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.threadId) {
      await fetchThread(props.threadId, channelId);
      await fetchMessages(props.threadId);
      joinRoom(`channel_${props.threadId}`);
    }
  }
);

// Handle reply in thread
const handleReply = (message: Message) => {
  replyToMessage.value = message;
};

const handleReplySent = () => {
  replyToMessage.value = null;
};

const handleReplyCancelled = () => {
  replyToMessage.value = null;
};

// Emit close event
const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    v-if="isOpen"
    class="thread-panel fixed top-0 right-0 h-full border-l border-[#202225] bg-dark-800 flex flex-col z-50 transition-all duration-300 w-[400px]"
  >
    <!-- Thread Header -->
    <div class="thread-header p-2 border-b border-[#202225]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-message-circle" class="w-5 h-5 text-blue-400" />
          <div>
            <h3 class="text-white font-semibold text-sm">
              {{ thread?.name || "Thread" }}
            </h3>
            <p class="text-gray-400 text-xs">
              {{ threadMessages.length }} tin nhắn
            </p>
          </div>
        </div>
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          @click="$emit('close')"
          class="p-1"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </UButton>
      </div>
    </div>

    <!-- Thread Messages -->
    <div class="thread-messages flex-1 overflow-y-auto">
      <!-- Check if there are messages in the thread -->
      <div v-if="threadMessages.length > 0" class="h-full">
        <!-- Thread messages using MessageList component -->
        <MoleculesMessageList
          :roomId="threadId"
          class="flex-1 min-h-0"
          @reply="handleReply"
        />
      </div>
      <!-- Default status if no messages -->
      <div v-else class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <UIcon
            name="i-lucide-message-circle"
            class="w-12 h-12 mx-auto mb-4 opacity-50"
          />
          <p class="text-sm">Chưa có tin nhắn nào trong thread này</p>
        </div>
      </div>
    </div>

    <!-- Thread Input -->
    <div class="thread-input mb-2">
      <MoleculesMessageInput
        :channelId="threadId"
        :replyTo="
          replyToMessage && replyToMessage.author
            ? {
                id: replyToMessage.id,
                content: replyToMessage.content,
                author: replyToMessage.author,
              }
            : undefined
        "
        :mentionAuthor="true"
        @reply-sent="handleReplySent"
        @reply-cancelled="handleReplyCancelled"
      />
    </div>
  </div>
</template>

<style scoped>
.thread-panel {
  color: #dcddde;
}

.thread-message-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
