<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";
import UploadButton from "./upload.button.vue";

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

const emit = defineEmits<{
  "reply-sent": [];
  "reply-cancelled": [];
  "user-active": [];
}>();

// --- Store và hooks ---
const route = useRoute();
const { sendMessage, isLoading } = useMessage();

// --- State ---
const messageText = ref("");
const inlineImagePreviews = ref<string[]>([]);

const effectiveChannelId = computed(() => {
  return (
    props.channelId ||
    (route.params.channel_id as string) ||
    (route.params.channelId as string) ||
    ""
  );
});

// --- Utility ---
const normalizeUrlText = (text: string) =>
  text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\[|\]|\(|\)|<|>/g, "");

const isImageUrl = (value: string) => {
  if (!value) return false;
  const cleaned = normalizeUrlText(value);
  return /^https?:\/\/[^\s]+?\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(
    cleaned
  );
};

const extractImageUrls = (text: string) => {
  if (!text) return [];
  const pattern =
    /(https?:\/\/[^\s]+?\.(?:jpe?g|png|gif|webp|bmp|svg)(?:\?[^\s]*)?)/gi;
  return [...text.matchAll(pattern)].map((m) => m[0]);
};
// --- Reply Thumbnail ---
const replyThumb = computed(() =>
  props.replyTo ? extractImageUrls(props.replyTo.content)[0] : null
);

// --- Input ---
const handleInput = (event: Event) => {
  emit("user-active");
  const value = (event.target as HTMLInputElement).value;

  // không cần trim ở đây để không mất khoảng trắng giữa text
  const urls = extractImageUrls(value);

  if (urls.length) {
    urls.forEach((url) => {
      if (!inlineImagePreviews.value.includes(url)) {
        inlineImagePreviews.value.push(url);
      }
    });

    // Xóa từng URL ảnh khỏi nội dung, giữ text
    let cleaned = value;
    urls.forEach((url) => {
      cleaned = cleaned.replace(url, "").trimStart();
    });
    messageText.value = cleaned;
  } else {
    messageText.value = value;
  }
};

const handlePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData("text") || "";
  if (!pastedText) return;

  const urls = extractImageUrls(pastedText);
  if (!urls.length) return;

  event.preventDefault(); // chặn dán thẳng text gốc vào input

  // Thêm ảnh preview
  urls.forEach((url) => {
    if (!inlineImagePreviews.value.includes(url)) {
      inlineImagePreviews.value.push(url);
    }
  });

  // Chèn phần còn lại (text không phải ảnh) vào input
  const cleaned = urls.reduce(
    (acc, url) => acc.replace(url, "").trimStart(),
    pastedText
  );

  // Ghép phần text còn lại vào input hiện tại
  messageText.value = (messageText.value + " " + cleaned).trim();
};

const handleImageUploaded = async (url: string) => {
  inlineImagePreviews.value.push(url);
};

const removePreview = (url: string) => {
  inlineImagePreviews.value = inlineImagePreviews.value.filter(
    (u) => u !== url
  );
};

const handleFocus = () => emit("user-active");
const handleKeyDown = () => emit("user-active");

// --- Gửi tin nhắn ---
const handleSendMessage = async () => {
  const channelId = effectiveChannelId.value;
  if (!channelId) return;

  const text = messageText.value.trim();
  const images = [...inlineImagePreviews.value];

  if (!text && images.length === 0) return;

  try {
    for (const img of images) {
      await sendMessage(channelId, img, "image");
    }
    if (text) {
      await sendMessage(channelId, text);
    }

    messageText.value = "";
    inlineImagePreviews.value = [];
  } catch (err) {}
};

const cancelReply = () => emit("reply-cancelled");
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
            <span class="font-semibold text-blue-400">
              {{ replyTo.author.username }}
            </span>
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
        <template v-if="replyThumb">
          <img
            :src="replyThumb"
            alt="reply-thumb"
            class="w-20 h-12 object-cover rounded"
          />
        </template>
        <template v-else>
          {{ replyTo.content }}
        </template>
      </div>
    </div>

    <!-- Image previews -->
    <div
      v-if="inlineImagePreviews.length"
      class="px-4 py-2 border-b border-gray-700 bg-[#2f3136] flex flex-wrap gap-3"
    >
      <div v-for="url in inlineImagePreviews" :key="url" class="relative group">
        <img :src="url" alt="preview" class="w-24 h-16 object-cover rounded" />
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition"
          @click="removePreview(url)"
        />
      </div>
    </div>

    <!-- Input -->
    <form
      @submit.prevent="handleSendMessage"
      class="input-wrapper flex items-end p-2"
    >
      <UButton
        variant="ghost"
        size="sm"
        class="mr-3 text-[#b9bbbe] hover:text-white"
        type="button"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
      </UButton>

      <UInput
        type="text"
        :placeholder="props.isThread ? 'Nhắn trong thread...' : 'Nhắn #general'"
        v-model="messageText"
        color="neutral"
        variant="none"
        size="lg"
        class="flex-1 !bg-transparent !ring-0 text-[#dcddde] placeholder-[#72767d]"
        @input="handleInput"
        @paste="handlePaste"
        @focus="handleFocus"
        @keydown="handleKeyDown"
      />

      <div class="input-actions flex items-center space-x-2 ml-3">
        <div class="mr-1">
          <UploadButton
            variant="ghost"
            size="sm"
            class="text-[#b9bbbe] hover:text-white"
            icon="i-lucide-image"
            @success="handleImageUploaded"
          />
        </div>

        <UButton
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="submit"
          :disabled="
            isLoading || (!messageText.trim() && !inlineImagePreviews.length)
          "
        >
          <UIcon name="i-lucide-send" class="w-5 h-5" />
        </UButton>
      </div>
    </form>
  </div>
</template>
