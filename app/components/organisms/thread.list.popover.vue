<script setup lang="ts">
import { computed } from "vue";
import { useMessage } from "~/composables/useMessage";

interface Props {
  channelId: string;
}

const props = defineProps<Props>();

const {
  getThreadsByChannel,
  fetchThreadsByChannel,
  getMessages,
  fetchMessages,
} = useMessage();
const threads = computed(() => getThreadsByChannel(props.channelId));

// Function to get message count for a thread
const getThreadMessageCount = (threadId: string) => {
  return getMessages(threadId).length;
};

// Load threads when component is mounted
onMounted(async () => {
  if (props.channelId) {
    await fetchThreadsByChannel(props.channelId);
    const threadIds = threads.value.map((t) => t.id);
    for (const threadId of threadIds) {
      await fetchMessages(threadId);
    }
  }
});

// Handle thread click
const emit = defineEmits<{
  threadClick: [threadId: string];
  createThread: [];
}>();

const handleThreadClick = (threadId: string) => {
  emit("threadClick", threadId);
};

const handleCreateThread = () => {
  emit("createThread");
};
</script>

<template>
  <div
    class="w-80 max-h-96 bg-dark-800 border-b border-[#202225] rounded-lg shadow-xl"
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-message-circle" class="w-5 h-5 text-blue-400" />
          Danh sách Thread
        </h3>
        <UButton
          size="sm"
          color="blue"
          variant="ghost"
          @click="handleCreateThread"
          class="text-xs"
        >
          <UIcon name="i-lucide-plus" class="w-3 h-3 mr-1" />
          Tạo
        </UButton>
      </div>
    </div>

    <!-- Threads List -->
    <div class="max-h-80 overflow-y-auto scrollbar-hide">
      <div v-if="threads.length === 0" class="p-4 text-center">
        <UIcon
          name="i-lucide-message-circle"
          class="w-8 h-8 text-gray-500 mx-auto mb-2"
        />
        <p class="text-gray-400 text-sm">Chưa có thread nào</p>
      </div>

      <div v-else class="divide-y divide-gray-700">
        <div
          v-for="thread in threads"
          :key="thread.id"
          class="p-3 hover:bg-dark-700 transition-colors cursor-pointer"
          @click="handleThreadClick(thread.id)"
        >
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-message-circle"
              class="w-4 h-4 text-blue-400 mt-1 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-white text-sm truncate">{{
                  thread.name
                }}</span>
                <span class="text-xs text-gray-400">
                  {{ getThreadMessageCount(thread.id) }} tin nhắn
                </span>
              </div>
              <div class="text-xs text-gray-400">
                Tạo bởi {{ thread.createdBy?.username }} •
                {{ new Date(thread.createdAt).toLocaleDateString("vi-VN") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
