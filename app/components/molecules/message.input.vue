<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";
import UploadButton from "./upload.button.vue";
import { useCommunityStore } from "~/stores/community/community.store";

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
const { sendMessage, replyToMessage, isLoading } = useMessage();
const communityStore = useCommunityStore();
const { currentCommunity } = storeToRefs(communityStore);
const members = computed(() => currentCommunity.value?.members ?? []);

// Get guild ID from route or current community
const guildId = computed(() => {
  return (route.params.guild_id as string) || currentCommunity.value?.id || "";
});

// --- Mention state ---
const showMentionDropdown = ref(false);
const mentionQuery = ref("");
const mentionStartPos = ref(0);
const selectedMentionIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const mentionDropdownRef = ref<HTMLElement | null>(null);

// Filtered members based on mention query
const filteredMembers = computed(() => {
  if (!mentionQuery.value) return members.value.slice(0, 5);

  const query = mentionQuery.value.toLowerCase();
  return members.value
    .filter((member) => {
      const username = member.user?.username?.toLowerCase() || "";
      const globalName = member.user?.globalName?.toLowerCase() || "";
      return username.includes(query) || globalName.includes(query);
    })
    .slice(0, 5);
});

// --- State ---
const messageText = ref("");
const inlineImagePreviews = ref<string[]>([]);
const showMarkdownHelp = ref(false);
const showEmojiPicker = ref(false);
const showStickerPicker = ref(false);

const effectiveChannelId = computed(() => {
  return (
    props.channelId ||
    (route.params.channel_id as string) ||
    (route.params.channelId as string) ||
    ""
  );
});

// Computed property to get highlighted text with mentions
const highlightedText = computed(() => {
  if (!messageText.value) return "";

  // Regex to match @username pattern
  const mentionRegex = /@(\w+)/g;

  return messageText.value.replace(
    mentionRegex,
    '<span class="mention-highlight">@$1</span>'
  );
});

// Parse message to identify mentions
const parseMessageWithMentions = (text: string) => {
  if (!text) return [{ text: "", isMention: false }];

  const parts: Array<{ text: string; isMention: boolean }> = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isMention: false,
      });
    }

    // Add mention
    parts.push({
      text: match[0],
      isMention: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isMention: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, isMention: false }];
};

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

// Parse reply content to display mentions correctly
const parseReplyContent = computed(() => {
  if (!props.replyTo?.content) return "";

  let content = props.replyTo.content;

  // Parse mentions in the format <@userId>
  content = content.replace(/<@(\w+)>/g, (match, userId) => {
    // If it's the reply author
    if (props.replyTo && userId === props.replyTo.author?.id) {
      return `@${props.replyTo.author.username}`;
    }

    // Try to find from community members
    const member = members.value.find((m) => m.user?.id === userId);
    if (member?.user?.username) {
      return `@${member.user.username}`;
    }

    // Fallback to userId
    return `@${userId}`;
  });

  return content;
});

// --- Input ---
const handleInput = (event: Event) => {
  emit("user-active");
  const input = event.target as HTMLInputElement;
  const value = input.value;
  const cursorPos = input.selectionStart || 0;

  // Check for @ mention
  checkForMention(value, cursorPos);

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

// ContentEditable handlers
const handleContentEditableInput = (event: Event) => {
  emit("user-active");
  const target = event.target as HTMLElement;
  const text = target.innerText || "";

  // Get cursor position
  const selection = window.getSelection();
  let cursorPos = 0;

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(target);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    cursorPos = preCaretRange.toString().length;
  }

  // Update message text
  messageText.value = text;

  // Check for mention
  const wasMentioning = showMentionDropdown.value;
  checkForMention(text, cursorPos);

  // Apply mention highlighting only when space is typed after mention
  if (wasMentioning && !showMentionDropdown.value && text.includes("@")) {
    applyMentionHighlight(target);
  }
};

const applyMentionHighlight = (element: HTMLElement) => {
  const text = element.innerText || "";
  const mentionRegex = /@(\w+)/g;

  // Save cursor position
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const cursorOffset = range.startOffset;
  const cursorNode = range.startContainer;

  // Calculate cursor position in text
  let cursorPos = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node;
  while ((node = walker.nextNode())) {
    if (node === cursorNode) {
      cursorPos += cursorOffset;
      break;
    }
    cursorPos += node.textContent?.length || 0;
  }

  // Create HTML with highlighted mentions
  const html = text.replace(
    mentionRegex,
    '<span class="mention-tag">@$1</span>'
  );

  // Only update if changed and has mentions
  if (mentionRegex.test(text) && element.innerHTML !== html) {
    element.innerHTML = html;

    // Restore cursor position
    try {
      const newRange = document.createRange();
      const newSelection = window.getSelection();

      let charCount = 0;
      let foundNode: Node | null = null;
      let foundOffset = 0;

      const newWalker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      while ((node = newWalker.nextNode())) {
        const nodeLength = node.textContent?.length || 0;
        if (charCount + nodeLength >= cursorPos) {
          foundNode = node;
          foundOffset = cursorPos - charCount;
          break;
        }
        charCount += nodeLength;
      }

      if (foundNode) {
        newRange.setStart(foundNode, foundOffset);
        newRange.collapse(true);
        newSelection?.removeAllRanges();
        newSelection?.addRange(newRange);
      }
    } catch (e) {
      console.error("Failed to restore cursor:", e);
    }
  }
};

const handleContentEditablePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const pastedText = event.clipboardData?.getData("text/plain") || "";

  // Insert text at cursor
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(pastedText));
    range.collapse(false);
  }

  // Trigger input event
  const target = event.target as HTMLElement;
  handleContentEditableInput({ target } as any);
};

const handleContentEditableKeyDown = (event: KeyboardEvent) => {
  emit("user-active");

  // Handle Shift+Enter for new line (allow default behavior)
  if (event.key === "Enter" && event.shiftKey) {
    // Let the browser handle the newline
    return;
  }

  // Handle Enter to submit (without Shift)
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    // If mention dropdown is open, select the mention
    if (showMentionDropdown.value && filteredMembers.value.length > 0) {
      selectMention(filteredMembers.value[selectedMentionIndex.value]);
      return;
    }

    // Otherwise send the message
    handleSendMessage();
    return;
  }

  // Handle mention dropdown navigation
  if (!showMentionDropdown.value) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectedMentionIndex.value = Math.min(
      selectedMentionIndex.value + 1,
      filteredMembers.value.length - 1
    );
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0);
  } else if (event.key === "Enter" && filteredMembers.value.length > 0) {
    event.preventDefault();
    selectMention(filteredMembers.value[selectedMentionIndex.value]);
  } else if (event.key === "Escape") {
    event.preventDefault();
    showMentionDropdown.value = false;
  }
};

// Check if user is typing a mention
const checkForMention = (text: string, cursorPos: number) => {
  const textBeforeCursor = text.substring(0, cursorPos);
  const lastAtIndex = textBeforeCursor.lastIndexOf("@");

  if (lastAtIndex === -1) {
    showMentionDropdown.value = false;
    return;
  }

  // Check if @ is at start or has space before it
  const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : " ";
  if (charBeforeAt !== " " && lastAtIndex !== 0) {
    showMentionDropdown.value = false;
    return;
  }

  // Get text after @
  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

  // Check if there's a space after @ (which means mention ended)
  if (textAfterAt.includes(" ")) {
    showMentionDropdown.value = false;
    return;
  }

  // Show mention dropdown
  mentionStartPos.value = lastAtIndex;
  mentionQuery.value = textAfterAt;
  showMentionDropdown.value = true;
  selectedMentionIndex.value = 0;
};

// Handle mention selection
const selectMention = (member: any) => {
  if (!inputRef.value) return;

  const text = messageText.value;
  const beforeMention = text.substring(0, mentionStartPos.value);
  const afterCursor = text.substring(
    mentionStartPos.value + mentionQuery.value.length + 1
  );

  const username = member.user?.username || "";
  const mention = `@${username}`;

  const newText = beforeMention + mention + " " + afterCursor;
  messageText.value = newText;

  // Update contenteditable
  if (inputRef.value) {
    inputRef.value.innerText = newText;
    applyMentionHighlight(inputRef.value);
  }

  showMentionDropdown.value = false;
  mentionQuery.value = "";

  // Focus back and set cursor position
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      const newCursorPos = beforeMention.length + mention.length + 1;

      // Set cursor position in contenteditable
      const range = document.createRange();
      const sel = window.getSelection();
      const textNode = inputRef.value.firstChild;

      if (textNode && sel) {
        range.setStart(
          textNode,
          Math.min(newCursorPos, textNode.textContent?.length || 0)
        );
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  });
};

// Close mention dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    mentionDropdownRef.value &&
    !mentionDropdownRef.value.contains(event.target as Node) &&
    inputRef.value &&
    !inputRef.value.contains(event.target as Node)
  ) {
    showMentionDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);

  // Don't auto-fill mention - backend will handle it when mentionAuthor=true
  // Just focus the input when reply is active
  if (props.replyTo && inputRef.value) {
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputRef.value);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }
});

// Watch for replyTo changes
watch(
  () => props.replyTo,
  (newReplyTo) => {
    if (newReplyTo) {
      // Don't auto-fill mention - backend will handle it
      // Just focus the input
      if (inputRef.value) {
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(inputRef.value);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        });
      }
    } else if (!newReplyTo) {
      // Clear input when reply is cancelled
      messageText.value = "";
      if (inputRef.value) {
        inputRef.value.innerText = "";
        inputRef.value.innerHTML = "";
      }
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handlePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData("text") || "";
  if (!pastedText) return;

  const urls = extractImageUrls(pastedText);
  if (!urls.length) return;

  event.preventDefault();

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

// --- Emoji handling ---
const handleEmojiSelect = async (emojiUrl: string) => {
  const channelId = effectiveChannelId.value;
  if (!channelId) return;

  try {
    // Send emoji as message immediately
    if (props.replyTo) {
      await replyToMessage(
        channelId,
        emojiUrl,
        props.replyTo.id,
        props.mentionAuthor ?? true
      );
      emit("reply-sent");
    } else {
      await sendMessage(channelId, emojiUrl, "image");
    }

    // Close picker
    showEmojiPicker.value = false;
  } catch (error) {
    console.error("Failed to send emoji:", error);
  }
};

const handleStickerSelect = async (stickerUrl: string) => {
  const channelId = effectiveChannelId.value;
  if (!channelId) return;

  try {
    // Send sticker as image
    if (props.replyTo) {
      await replyToMessage(
        channelId,
        stickerUrl,
        props.replyTo.id,
        props.mentionAuthor ?? true
      );
      emit("reply-sent");
    } else {
      await sendMessage(channelId, stickerUrl, "image");
    }

    // Close picker
    showStickerPicker.value = false;
  } catch (error) {
    console.error("Failed to send sticker:", error);
  }
};

// --- Gửi tin nhắn ---
const handleSendMessage = async () => {
  const channelId = effectiveChannelId.value;
  if (!channelId) return;

  const text = messageText.value.trim();
  const images = [...inlineImagePreviews.value];

  if (!text && images.length === 0) return;

  try {
    // Send images first
    for (const img of images) {
      if (props.replyTo) {
        await replyToMessage(
          channelId,
          img,
          props.replyTo.id,
          props.mentionAuthor ?? true
        );
      } else {
        await sendMessage(channelId, img, "image");
      }
    }

    // Send text message
    if (text) {
      if (props.replyTo) {
        await replyToMessage(
          channelId,
          text,
          props.replyTo.id,
          props.mentionAuthor ?? true
        );
      } else {
        await sendMessage(channelId, text);
      }
    }

    messageText.value = "";
    inlineImagePreviews.value = [];

    // Clear contenteditable
    if (inputRef.value) {
      inputRef.value.innerText = "";
      inputRef.value.innerHTML = "";
    }

    // Emit reply-sent event
    if (props.replyTo) {
      emit("reply-sent");
    }
  } catch (err) {
    console.error("Failed to send message:", err);
  }
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
          {{ parseReplyContent }}
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
      class="input-wrapper flex items-end p-2 relative"
    >
      <!-- Mention Dropdown -->
      <div
        v-if="showMentionDropdown && filteredMembers.length > 0"
        ref="mentionDropdownRef"
        class="absolute bottom-full left-0 mb-2 w-80 bg-[#2f3136] rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
      >
        <div class="p-2 text-xs text-gray-400 font-semibold uppercase">
          Members
        </div>
        <div class="max-h-60 overflow-y-auto">
          <div
            v-for="(member, index) in filteredMembers"
            :key="member.user?.id || index"
            @click="selectMention(member)"
            :class="[
              'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
              selectedMentionIndex === index
                ? 'bg-[#4752c4] text-white'
                : 'hover:bg-[#36393f] text-gray-300',
            ]"
          >
            <div
              class="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden"
            >
              <img
                v-if="member.user?.avatar"
                :src="member.user.avatar"
                :alt="member.user?.username || 'User'"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-white font-semibold"
              >
                {{ (member.user?.username || "U").charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">
                {{
                  member.user?.globalName || member.user?.username || "Unknown"
                }}
              </div>
              <div class="text-xs text-gray-400 truncate">
                @{{ member.user?.username || "unknown" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UButton
        variant="ghost"
        size="sm"
        class="mr-3 text-[#b9bbbe] hover:text-white"
        type="button"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
      </UButton>

      <div
        ref="inputRef"
        contenteditable="true"
        :data-placeholder="
          props.isThread ? 'Nhắn trong thread...' : 'Nhắn #general'
        "
        class="mention-input flex-1 px-3 py-1.5 bg-transparent outline-none text-[#dcddde] text-base min-h-[30px] max-h-[100px] overflow-y-auto"
        @input="handleContentEditableInput"
        @paste="handleContentEditablePaste"
        @focus="handleFocus"
        @keydown="handleContentEditableKeyDown"
      ></div>

      <div class="input-actions flex items-center space-x-2 ml-3">
        <!-- Emoji Picker with Popover -->
        <UPopover v-if="guildId" v-model:open="showEmojiPicker">
          <UButton
            variant="ghost"
            size="sm"
            class="text-[#b9bbbe] hover:text-white"
            type="button"
            title="Emoji"
          >
            <UIcon name="i-lucide-smile" class="w-5 h-5" />
          </UButton>

          <template #content>
            <AtomsEmojiPicker :guild-id="guildId" @select="handleEmojiSelect" />
          </template>
        </UPopover>

        <!-- Sticker Picker with Popover -->
        <UPopover v-if="guildId" v-model:open="showStickerPicker">
          <UButton
            variant="ghost"
            size="sm"
            class="text-[#b9bbbe] hover:text-white"
            type="button"
            title="Sticker/GIF"
          >
            <UIcon name="i-lucide-sticker" class="w-5 h-5" />
          </UButton>

          <template #content>
            <AtomsStickerPicker
              :guild-id="guildId"
              @select="handleStickerSelect"
            />
          </template>
        </UPopover>

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

    <!-- Markdown Help Tooltip -->
    <div
      v-if="showMarkdownHelp"
      class="px-4 py-3 border-t border-gray-700 bg-[#2f3136] text-xs text-gray-300"
    >
      <div class="font-semibold mb-2 text-white">
        Markdown Support - Shift+Enter để xuống dòng
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><code>**bold**</code> → <strong>bold</strong></div>
        <div><code>*italic*</code> → <em>italic</em></div>
        <div>
          <code>`code`</code> →
          <code class="px-1 bg-black/30 rounded">code</code>
        </div>
        <div><code>~~strikethrough~~</code> → <del>strikethrough</del></div>
        <div><code>- list item</code> → • list item</div>
        <div><code>[link](url)</code> → link</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-input {
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
}

.mention-input:empty:before {
  content: attr(data-placeholder);
  color: #72767d;
  pointer-events: none;
}

.mention-input:focus {
  outline: none;
}

:deep(.mention-tag) {
  background-color: rgba(88, 101, 242, 0.3);
  border-radius: 3px;
  padding: 2px 4px;
  font-weight: 500;
  user-select: all;
  cursor: pointer;
}

:deep(.mention-tag):hover {
  background-color: rgba(88, 101, 242, 0.5);
}
</style>
