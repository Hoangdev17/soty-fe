<script setup lang="ts">
import { computed } from "vue";
import { useMessage } from "~/composables/useMessage";

interface Props {
  channelId: string;
}

const props = defineProps<Props>();

const { getPinnedMessages, fetchPinnedMessages, unpinMessage } = useMessage();

const pinnedMessages = computed(() => getPinnedMessages(props.channelId));

// Load pinned messages when component is mounted
onMounted(async () => {
  if (props.channelId) {
    await fetchPinnedMessages(props.channelId);
  }
});

// Handle unpin message
const handleUnpin = async (messageId: string) => {
  try {
    await unpinMessage(messageId, props.channelId);
  } catch (error) {
  }
};
</script>

<template>
  <div
    class="w-80 max-h-96 bg-dark-800 border-b border-[#202225] rounded-lg shadow-xl"
  >
    <!-- Header -->
    <div class="p-4 border-b border-[#202225]">
      <h3 class="text-white font-semibold flex items-center gap-2">
        <UIcon name="i-lucide-pin" class="w-5 h-5 text-yellow-400" />
        Tin nhắn đã ghim
      </h3>
    </div>

    <!-- Messages List -->
    <div class="max-h-80 overflow-y-auto">
      <div v-if="pinnedMessages.length === 0" class="p-4 text-center">
        <UIcon name="i-lucide-pin" class="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p class="text-gray-400 text-sm">Chưa có tin nhắn nào được ghim</p>
      </div>

      <div v-else class="divide-y divide-dark-700">
        <div
          v-for="message in pinnedMessages"
          :key="message.id"
          class="p-3 hover:bg-dark-700 transition-colors group"
        >
          <div class="flex items-start gap-3">
            <UAvatar
              :src="message.author?.avatar"
              :alt="message.author?.username"
              size="sm"
              class="flex-shrink-0 mt-1"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-white text-sm">{{
                  message.author?.username
                }}</span>
                <span class="text-xs text-gray-400">
                  {{ new Date(message.createdAt).toLocaleDateString("vi-VN") }}
                </span>
              </div>
              <div class="text-sm text-gray-300 line-clamp-2">
                {{ message.content }}
              </div>
            </div>
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              @click="handleUnpin(message.id)"
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1"
              title="Bỏ ghim"
            >
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pinned-messages-popover :deep(.popover-content) {
  background: transparent;
  border: none;
  box-shadow: none;
}
</style>
