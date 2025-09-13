<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from "vue";
import { useMessage } from "~/composables/useMessage";
import AtomsMessageLoading from "~/components/atoms/message.loading.vue";

const props = defineProps<{
  roomId: string;
}>();

const { getMessages } = useMessage();
const messages = computed(() => getMessages(props.roomId));

const isLoading = ref(true);
const hasLoadedOnce = ref(false);

// Container ref for scrolling
const listContainer = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  const el = listContainer.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

// Scroll when messages change and on mount
watch(
  messages,
  async () => {
    scrollToBottom();
    // Ensure minimum loading time before hiding
    if (messages.value.length > 0) {
    }
  },
  { deep: true }
);

onMounted(async () => {
  scrollToBottom();
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
  >
    <!-- Loading state - Show multiple loading skeletons -->
    <div v-if="isLoading" class="space-y-2">
      <AtomsMessageLoading />
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
