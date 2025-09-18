<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from "vue";
import { useMessage } from "~/composables/useMessage";

const props = defineProps<{
  roomId: string;
}>();

const emit = defineEmits<{
  reply: [message: any];
  threadClick: [threadId: string];
  createThread: [message: any];
}>();

const { getMessages, fetchMessages, pinMessage, unpinMessage } = useMessage();
const messages = computed(() => getMessages(props.roomId));

// Modal state
const offset = ref(0);
const limit = 50;
const hasMore = ref(true);
const loadingMore = ref(false);

// Container ref for scrolling
const listContainer = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  const el = listContainer.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

const handleScroll = async () => {
  const el = listContainer.value;
  if (!el || loadingMore.value || !hasMore.value) return;

  // If scrolled to top (within 50px), load more
  if (el.scrollTop <= 50) {
    loadingMore.value = true;
    offset.value += limit;

    try {
      await fetchMessages(props.roomId, limit, offset.value);
      // If less than limit messages returned, no more
      const newMessages = getMessages(props.roomId);
      if (newMessages.length < offset.value + limit) {
        hasMore.value = false;
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      loadingMore.value = false;
    }
  }
};

// Scroll when messages change and on mount
watch(
  messages,
  async () => {
    scrollToBottom();
  },
  { deep: true }
);

onMounted(async () => {
  await fetchMessages(props.roomId, limit, offset.value);
  // Don't scroll to bottom initially for pagination
});

const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString();
};

// Message action handlers
const handleReply = (message: any) => {
  // Emit event to parent component to handle reply
  emit("reply", message);
};

const handlePin = async (message: any) => {
  try {
    await pinMessage(message.id, props.roomId);
  } catch (error) {
    console.error("Failed to pin message:", error);
  }
};

const handleUnpin = async (message: any) => {
  try {
    await unpinMessage(message.id, props.roomId);
  } catch (error) {
    console.error("Failed to unpin message:", error);
  }
};

const handleThreadClick = (message: any) => {
  if (message.threadId) {
    emit("threadClick", message.threadId);
  }
};

const handleCreateThread = (message: any) => {
  emit("createThread", message);
};

// Helper function to parse message content with mentions
const parseMessageContent = (content: string, replyTo?: any) => {
  if (!content) return content;

  // Parse mentions in the format <@userId>
  return content.replace(/<@(\w+)>/g, (match, userId) => {
    // If this is a reply and the mention is at the beginning, it's likely the reply mention
    if (replyTo && content.startsWith(match)) {
      return `@${replyTo.author.username}`;
    }
    // For other mentions, you might want to resolve the username from a user store
    // For now, we'll just return the userId with @ prefix
    return `@${userId}`;
  });
};

// Helper function to check if message type indicates a reply
const isReplyMessage = (message: any) => {
  return message.type === 19 || message.type === "reply" || message.replyTo;
};
</script>

<template>
  <!-- MessageList should be a flex-1 scrollable area when placed inside a flex column with min-h-0 -->
  <div
    ref="listContainer"
    class="message-list flex flex-col hide-scrollbar overflow-y-auto p-2 h-full flex-1 min-h-0"
    @scroll="handleScroll"
  >
    <!-- Loading more indicator -->
    <div v-if="loadingMore" class="flex justify-center py-2">
      <div
        class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
      ></div>
    </div>

    <!-- Messages -->
    <div
      v-for="(message, index) in messages"
      :key="message.id"
      class="message p-3 rounded mb-2 hover:bg-dark-500 transition-colors group relative"
      :class="{
        'mt-auto': index === 0,
        'bg-cyan-50 dark:bg-cyan-700/25': isReplyMessage(message),
        'bg-dark-600': !isReplyMessage(message),
      }"
    >
      <!-- Reply context -->
      <div v-if="message.replyTo" class="mb-2 pl-4 border-l-2 border-gray-500">
        <div class="text-xs text-gray-400 mb-1">
          Trả lời
          <span class="font-semibold text-gray-300">{{
            message.replyTo.author.username
          }}</span>
        </div>
        <div class="text-sm text-gray-300 line-clamp-2">
          {{ message.replyTo.content }}
        </div>
      </div>

      <div class="flex">
        <div class="mr-3">
          <UAvatar
            :src="message.author?.avatar"
            :alt="message.author?.username"
            size="xl"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold">{{
              message.author?.username || "Unknown"
            }}</span>
            <span class="text-xs text-gray-400">{{
              formatTime(message.createdAt)
            }}</span>
            <!-- Pin indicator -->
            <UIcon
              v-if="message.pinned"
              name="i-lucide-pin"
              class="w-3 h-3 text-yellow-400"
              title="Tin nhắn đã ghim"
            />
            <!-- Thread indicator -->
            <div
              v-if="message.isThreadStarter"
              class="flex items-center gap-1 text-xs text-blue-400 cursor-pointer hover:text-blue-300"
              @click="handleThreadClick(message)"
            >
              <UIcon name="i-lucide-message-circle" class="w-3 h-3" />
              <span>{{ message.threadCount || 0 }} trả lời</span>
            </div>
          </div>
          <div class="message-content">
            {{ parseMessageContent(message.content, message.replyTo) }}
          </div>
        </div>

        <!-- Message actions (visible on hover) -->
        <div
          class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
        >
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            class="p-1 hover:bg-dark-400"
            @click="handleReply(message)"
            title="Trả lời"
          >
            <UIcon name="i-lucide-reply" class="w-4 h-4" />
          </UButton>
          <UButton
            v-if="!message.pinned"
            size="xs"
            color="gray"
            variant="ghost"
            class="p-1 hover:bg-dark-400"
            @click="handlePin(message)"
            title="Ghim tin nhắn"
          >
            <UIcon name="i-lucide-pin" class="w-4 h-4" />
          </UButton>
          <UButton
            v-else
            size="xs"
            color="yellow"
            variant="ghost"
            class="p-1 hover:bg-yellow-600"
            @click="handleUnpin(message)"
            title="Bỏ ghim"
          >
            <UIcon name="i-lucide-pin-off" class="w-4 h-4" />
          </UButton>
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            class="p-1 hover:bg-dark-400"
            @click="handleCreateThread(message)"
            title="Tạo thread"
          >
            <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar {
  /* Cho phép scroll nhưng ẩn thanh cuộn */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.message-content {
  /* Allow long messages to wrap and preserve newlines */
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
