<script setup lang="ts">
import { ref } from "vue";
import { useMessage } from "~/composables/useMessage";
import { ChannelType } from "~/stores/channels/channel.type";
import { useMessageStore } from "~/stores/message/message.store";
interface Props {
  isOpen: boolean;
  channelId: string;
  starterMessageId?: string;
  starterMessageContent?: string;
}

const props = defineProps<Props>();

const { createThread } = useMessage();

const isPrivate = ref(false);
const isCreating = ref(false);

const state = ref({
  name: "",
  topic: "",
  type: ChannelType.GUILD_PUBLIC_THREAD,
});

// Emit events
const emit = defineEmits<{
  close: [];
  threadCreated: [threadId: string];
}>();

// Handle create thread
const handleCreateThread = async () => {
  if (!state.value.name.trim()) return;

  isCreating.value = true;
  try {
    const threadType = isPrivate.value
      ? ChannelType.GUILD_PRIVATE_THREAD
      : ChannelType.GUILD_PUBLIC_THREAD;

    const thread = await createThread(
      props.channelId,
      props.starterMessageId || state.value.topic,
      state.value.name.trim(),
      state.value.topic.trim(),
      threadType
    );
    emit("threadCreated", thread.id);
    state.value.name = "";
    state.value.topic = "";
    state.value.type = ChannelType.GUILD_PUBLIC_THREAD;
    isPrivate.value = false;
  } catch (error) {
  } finally {
    isCreating.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  state.value.name = "";
  state.value.topic = "";
  state.value.type = ChannelType.GUILD_PUBLIC_THREAD;
  isPrivate.value = false;
  emit("close");
};
</script>

<template>
  <div
    v-if="isOpen"
    class="create-thread-panel fixed top-0 right-0 h-full border-l border-[#202225] bg-dark-800 flex flex-col z-50 transition-all duration-300 w-[400px]"
  >
    <!-- Header -->
    <div class="p-4 border-dark-700">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-plus" class="w-5 h-5 text-blue-400" />
          Tạo Thread
        </h3>
        <UButton
          size="sm"
          color="gray"
          variant="ghost"
          @click="handleCancel"
          class="p-1"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </UButton>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <!-- Starter Message Preview -->
      <div v-if="starterMessageContent" class="mb-4 p-3 bg-dark-800 rounded-lg">
        <div class="text-sm text-gray-300 line-clamp-2">
          {{ starterMessageContent }}
        </div>
      </div>

      <p class="text-gray-400 text-sm mb-4">
        Tạo một cuộc trò chuyện phụ để thảo luận về tin nhắn này
      </p>
    </div>

    <!-- Controls at bottom -->
    <div class="p-4 space-y-4">
      <!-- Title Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2 w-full">
          Tên chủ đề
        </label>
        <UInput
          v-model="state.name"
          placeholder="Nhập tên chủ đề..."
          class="w-full"
          :disabled="isCreating"
          autofocus
        />
      </div>

      <!-- Topic Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2 w-full">
          Mô tả (tùy chọn)
        </label>
        <UInput
          v-model="state.topic"
          placeholder="Nhập mô tả cho thread..."
          class="w-full"
          :disabled="isCreating"
        />
      </div>

      <!-- Private Checkbox -->
      <div>
        <UCheckbox
          v-model:checked="isPrivate"
          label="Riêng tư"
          :disabled="isCreating"
        />
        <p class="text-xs text-gray-400 mt-1">
          Chỉ những người được mời mới có thể xem thread này
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          color="gray"
          @click="handleCancel"
          :disabled="isCreating"
          size="sm"
        >
          Hủy
        </UButton>
        <UButton
          @click="handleCreateThread"
          :loading="isCreating"
          :disabled="!state.name.trim()"
          size="sm"
        >
          Tạo Thread
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
