<script setup lang="ts">
import type { ContextMenuItem } from "@nuxt/ui";
import { ref, watch, nextTick, onMounted, computed } from "vue";
import { useMessage } from "~/composables/useMessage";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { navigateTo } from "#app";
import type { User } from "~/stores/auth/auth.type";

const props = defineProps<{
  roomId: string;
}>();

const emit = defineEmits<{
  reply: [message: any];
  threadClick: [threadId: string];
  createThread: [message: any];
  scrolledToBottom: [];
}>();

const { getMessages, fetchMessages, pinMessage, unpinMessage } = useMessage();
const messages = computed(() => getMessages(props.roomId));
const channelStore = useChannelStore();
const authStore = useAuthStore();

// Helper to get avatar effect URL for a given author
const getAvatarEffectUrl = (author: any) => {
  if (!author?.avatarEffectId) return null;
  const effect = authStore.decoration?.find(
    (d: any) => d.id === author.avatarEffectId
  );
  if (!effect) {
    authStore.fetchAvatarDecorationById(author.avatarEffectId);
  }
  return effect?.metadata?.link || effect?.metadata?.image || null;
};
//
// Modal state
const offset = ref(0);
const limit = 50;
const hasMore = ref(true);
const loadingMore = ref(false);

// Image viewer state
const selectedImageUrl = ref<string | null>(null);
const isImageModalOpen = ref(false);

const openImageViewer = (url: string) => {
  selectedImageUrl.value = url;
  isImageModalOpen.value = true;
};

const downloadImage = async () => {
  if (!selectedImageUrl.value) return;
  try {
    const res = await fetch(selectedImageUrl.value);
    const blob = await res.blob();
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    const parts = selectedImageUrl.value.split("/");
    const filename = parts[parts.length - 1]?.split("?")[0] || "image";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("Download failed, opening in new tab", err);
    window.open(selectedImageUrl.value, "_blank");
  }
};

// Container ref for scrolling
const listContainer = ref<HTMLElement | null>(null);

const getContextMenuItems = (message: any): ContextMenuItem[][] => {
  return [
    [
      {
        label: "Trả lời",
        icon: "i-lucide-reply",
        click: () => handleReply(message),
      },
      {
        label: message.pinned ? "Bỏ ghim" : "Ghim tin nhắn",
        icon: message.pinned ? "i-lucide-pin-off" : "i-lucide-pin",
        click: () =>
          message.pinned ? handleUnpin(message) : handlePin(message),
      },
      {
        label: "Tạo thread",
        icon: "i-lucide-message-circle",
        click: () => handleCreateThread(message),
      },
    ],
  ];
};

const getContextMenuUserItems = (message: any): ContextMenuItem[][] => {
  return [
    [
      {
        label: "Hồ sơ",
        icon: "i-lucide-user",
        click: () => console.log("View profile", message.author),
      },
      {
        label: "Nhắn tin",
        icon: "i-lucide-message-circle",
        onSelect: () => handleCreateDM(message.author.id),
      },
    ],
  ];
};

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

  // Check if scrolled to bottom (within 10px)
  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 10;
  if (isAtBottom) {
    emit("scrolledToBottom");
  }

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

const handleCreateDM = async (userId: string) => {
  try {
    const channelDM = await channelStore.createChannelDm([userId]);
    navigateTo(`/@me/${channelDM.id}`);
  } catch (error) {
    console.error("Failed to create DM:", error);
  }
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
    <UContextMenu
      v-for="(message, index) in messages"
      :key="message.id"
      :items="getContextMenuItems(message)"
      mode="contextmenu"
      :ui="{
        content: 'w-48',
      }"
    >
      <div
        class="message p-3 rounded mb-2 hover:bg-dark-500 transition-colors group relative"
        :class="{
          'mt-auto': index === 0,
          'bg-cyan-50 dark:bg-cyan-700/25': isReplyMessage(message),
          'bg-dark-600': !isReplyMessage(message),
        }"
      >
        <!-- Reply context -->
        <div
          v-if="message.replyTo"
          class="mb-2 pl-4 border-l-2 border-gray-500"
        >
          <div class="text-xs text-gray-400 mb-1">
            Trả lời
            <span class="font-semibold text-gray-300">{{
              message.replyTo.author.username
            }}</span>
          </div>
          <div class="text-sm text-gray-300 line-clamp-2">
            <template
              v-if="
                /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(
                  String(message.replyTo.content)
                )
              "
            >
              <img
                :src="message.replyTo.content"
                alt="reply-thumb"
                class="w-20 h-12 object-cover rounded"
              />
            </template>
            <template v-else>
              {{ message.replyTo.content }}
            </template>
          </div>
        </div>

        <div class="flex">
          <div class="mr-3">
            <UContextMenu
              :items="getContextMenuUserItems(message)"
              mode="contextmenu"
              :ui="{
                content: 'w-48',
              }"
              @contextmenu.stop
            >
              <div class="relative">
                <UAvatar
                  :src="message.author?.avatar"
                  :alt="message.author?.username"
                  size="xl"
                />
                <img
                  v-if="getAvatarEffectUrl(message.author)"
                  :src="getAvatarEffectUrl(message.author)"
                  alt="avatar-effect"
                  class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-20"
                />
              </div>
            </UContextMenu>
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
              <template
                v-if="
                  message.type === 'image' ||
                  message.type === 'img' ||
                  /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(
                    String(message.content)
                  )
                "
              >
                <img
                  :src="message.content"
                  alt="image"
                  loading="lazy"
                  class="message-image rounded-md object-contain cursor-zoom-in"
                  @click="openImageViewer(message.content)"
                />
              </template>
              <template v-else>
                {{ parseMessageContent(message.content, message.replyTo) }}
              </template>
            </div>
          </div>

          <!-- Message actions (visible on hover) -->
          <div
            class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
          >
            <UButton
              size="xs"
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
              color="warning"
              variant="ghost"
              class="p-1 hover:bg-yellow-600"
              @click="handleUnpin(message)"
              title="Bỏ ghim"
            >
              <UIcon name="i-lucide-pin-off" class="w-4 h-4" />
            </UButton>
            <UButton
              size="xs"
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
    </UContextMenu>
  </div>
  <UModal v-model:open="isImageModalOpen" class="max-w-4xl">
    <template #content>
      <div class="flex flex-col items-center gap-4 p-4">
        <img
          v-if="selectedImageUrl"
          :src="selectedImageUrl"
          alt="full-image"
          class="max-h-[80vh] max-w-full object-contain rounded"
        />
        <div class="flex gap-2">
          <UButton color="primary" @click="downloadImage">Tải xuống</UButton>
          <UButton variant="ghost" @click="isImageModalOpen = false"
            >Đóng</UButton
          >
        </div>
      </div>
    </template>
  </UModal>
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

/* Regular message image sizing */
.message-image {
  width: 160px;
  height: auto;
  max-height: 300px;
}

@media (max-width: 640px) {
  .message-image {
    width: 120px !important;
    max-height: 180px !important;
  }
}

@media (min-width: 1024px) {
  .message-image {
    width: 400px;
    max-height: 400px;
  }
}
</style>
