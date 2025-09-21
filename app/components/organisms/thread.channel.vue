<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useMessageStore } from "~/stores/message/message.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";

interface Props {
  threadId: string;
}

const props = defineProps<Props>();
const channelStore = useChannelStore();
const messageStore = useMessageStore();
const wsStore = useWebSocketStore();

const route = useRoute();
const { getThread, fetchThread, getMessages, joinRoom } = useMessage();

// Thread data
const thread = computed(() => getThread(props.threadId));
const channelId = channelStore.currentChannel?.id;

// Thread messages
const threadMessages = computed(() => getMessages(props.threadId));

// Latest message ID for read receipts
const lastMessageId = computed(() => {
  const msgs = threadMessages.value;
  return msgs && msgs.length > 0 ? msgs[msgs.length - 1]?.id : null;
});

// Unread count for this thread
const unreadCount = computed(() => {
  return wsStore.getUnreadCount(props.threadId);
});

// Reply state
const replyToMessage = ref(null);

// Function to send read receipt when opening thread
const sendReadReceiptForThread = async () => {
  // Get last read message from localStorage first, then fallback to latest message
  const lastReadFromStorage = wsStore.getLastReadMessageId(props.threadId);
  const messageIdToSend = lastReadFromStorage || lastMessageId.value;

  if (props.threadId && messageIdToSend) {
    try {
      await wsStore.sendReadReceipt(props.threadId, messageIdToSend);
    } catch (error) {
      console.error("❌ Failed to send read receipt on thread open:", error);
    }
  }
};

// Handle scrolled to bottom from message list
const handleScrolledToBottom = async () => {
  if (props.threadId) {
    const lastReadFromStorage = wsStore.getLastReadMessageId(props.threadId);
    const messageIdToSend = lastReadFromStorage || lastMessageId.value;

    if (messageIdToSend) {
      try {
        await wsStore.sendReadReceipt(props.threadId, messageIdToSend);
      } catch (error) {
        console.error(
          "❌ Failed to send read receipt on scroll to bottom in thread:",
          error
        );
      }
    }
  }
};

// Load thread data when threadId changes
watch(
  () => props.threadId,
  async (newThreadId, oldThreadId) => {
    if (newThreadId && channelId) {
      await fetchThread(channelId, newThreadId);
      joinRoom(newThreadId);

      // Send read receipt when switching to new thread
      if (newThreadId !== oldThreadId) {
        // Get last read message from localStorage first, then fallback to latest message
        const lastReadFromStorage = wsStore.getLastReadMessageId(newThreadId);
        const messageIdToSend =
          lastReadFromStorage || messageStore.getLatestMessage(newThreadId)?.id;

        if (messageIdToSend) {
          try {
            await wsStore.sendReadReceipt(newThreadId, messageIdToSend);
          } catch (error) {
            console.error(
              "❌ Failed to send read receipt on thread switch:",
              error
            );
          }
        }
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  sendReadReceiptForThread();

  if (unreadCount.value > 0) {
    wsStore.clearUnread(props.threadId);
  }
});

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
          @scrolled-to-bottom="handleScrolledToBottom"
        />
      </div>

      <!-- Message Input -->
      <div class="message-input-area p-4 border-t border-dark-700">
        <MoleculesMessageInput
          :channelId="threadId"
          :replyTo="replyToMessage!"
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
