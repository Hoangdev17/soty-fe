<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";

const props = defineProps<{
  channelId?: string;
  isThread?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: {
      id?: string;
      username: string;
      avatar?: string;
    };
  };
  mentionAuthor?: boolean;
}>();

const route = useRoute();

// Fallback to route param if prop not provided
const effectiveChannelId = computed(() => {
  return (
    props.channelId ||
    (route.params.channel_id as string) ||
    (route.params.channelId as string) ||
    ""
  );
});

const { sendMessage, sendMessageToThread, replyToMessage, isLoading } =
  useMessage();
const messageText = ref("");

const handleInput = () => {
  emit("user-active");
};

const handleFocus = () => {
  emit("user-active");
};

const handleKeyDown = () => {
  emit("user-active");
};

const handleSendMessage = async () => {
  if (!messageText.value.trim()) return;

  const channelId = effectiveChannelId.value;
  if (!channelId) {
    console.warn("No channelId available to send message");
    return;
  }

  try {
    if (props.replyTo) {
      // Send reply
      if (props.isThread) {
        // For thread replies, send to thread endpoint with reply metadata
        await sendMessageToThread(channelId, messageText.value.trim());
        // Note: Thread replies don't use the same reply structure as channel replies
      } else {
        await replyToMessage(
          channelId,
          messageText.value.trim(),
          props.replyTo.id,
          props.mentionAuthor ?? true
        );
      }
      emit("reply-sent");
    } else {
      // Send regular message or thread message
      if (props.isThread) {
        await sendMessageToThread(channelId, messageText.value.trim());
      } else {
        await sendMessage(channelId, messageText.value.trim());
      }
    }
    messageText.value = "";
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};

const cancelReply = () => {
  emit("reply-cancelled");
};

// Define emits
const emit = defineEmits<{
  "reply-sent": [];
  "reply-cancelled": [];
  "user-active": [];
}>();
</script>

<template>
  <div class="message-input-container bg-[#40444b] rounded-lg">
    <!-- Reply context -->
    <div v-if="replyTo" class="px-4 py-2 border-b border-gray-600 bg-[#2f3136]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-reply" class="w-4 h-4 text-blue-400" />
          <span class="text-sm text-gray-300">
            Trả lời
            <span class="font-semibold text-blue-400">{{
              replyTo.author.username
            }}</span>
          </span>
        </div>
        <UButton
          @click="cancelReply"
          variant="ghost"
          class="p-1 hover:bg-gray-600"
          size="xs"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </UButton>
      </div>
      <div class="text-sm text-gray-400 mt-1 line-clamp-1">
        {{ replyTo.content }}
      </div>
    </div>

    <form
      @submit.prevent="handleSendMessage"
      class="input-wrapper flex items-end p-2"
    >
      <!-- Nút thêm (+) -->
      <UButton
        variant="ghost"
        size="sm"
        class="mr-3 text-[#b9bbbe] hover:text-white"
        type="button"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
      </UButton>

      <!-- Input chat -->
      <UInput
        type="text"
        :placeholder="props.isThread ? 'Nhắn trong thread...' : 'Nhắn #general'"
        v-model="messageText"
        color="neutral"
        variant="none"
        size="lg"
        class="flex-1 !bg-transparent !ring-0 text-[#dcddde] placeholder-[#72767d]"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeyDown"
      />

      <!-- Action buttons -->
      <div class="input-actions flex items-center space-x-2 ml-3">
        <UButton
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="button"
        >
          <UIcon name="i-lucide-check-circle" class="w-5 h-5" />
        </UButton>

        <UButton
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="button"
        >
          <UIcon name="i-lucide-user" class="w-5 h-5" />
        </UButton>

        <!-- Nút gửi tin nhắn -->
        <UButton
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="submit"
          :disabled="isLoading || !messageText.trim()"
        >
          <UIcon name="i-lucide-send" class="w-5 h-5" />
        </UButton>
      </div>
    </form>
  </div>
</template>
