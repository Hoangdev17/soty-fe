<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from "vue";
import { useMessage } from "~/composables/useMessage";
import AtomsMessageLoading from "~/components/atoms/message.loading.vue";

const props = defineProps<{
  roomId: string;
}>();

const { getMessages, fetchMessages } = useMessage();
const messages = computed(() => getMessages(props.roomId));

// Track pagination
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
      class="message p-3 rounded bg-dark-600 mb-2"
      :class="{ 'mt-auto': index === 0 }"
    >
      <div class="flex">
        <div class="mr-3">
          <UAvatar
            :src="message.author?.avatar"
            :alt="message.author?.username"
            size="xl"
          />
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold">{{
              message.author?.username || "Unknown"
            }}</span>
            <span class="text-xs text-gray-400">{{
              formatTime(message.createdAt)
            }}</span>
          </div>
          <div class="message-content">{{ message.content }}</div>
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
