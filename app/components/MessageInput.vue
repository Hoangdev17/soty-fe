<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "~/composables/useMessage";

const props = defineProps<{
  channelId?: string;
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

const { sendMessage, isLoading, error } = useMessage();
const messageText = ref("");

const handleSendMessage = async () => {
  if (!messageText.value.trim()) return;

  const channelId = effectiveChannelId.value;
  if (!channelId) {
    console.warn("No channelId available to send message");
    return;
  }

  try {
    await sendMessage(channelId, messageText.value.trim());
    messageText.value = "";
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};
</script>

<template>
  <div class="message-input-container bg-[#40444b] rounded-lg">
    <form
      @submit.prevent="handleSendMessage"
      class="input-wrapper flex items-end p-2"
    >
      <!-- Nút thêm (+) -->
      <UButton
        color="transparent"
        size="sm"
        class="mr-3 text-[#b9bbbe] hover:text-white"
        type="button"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
      </UButton>

      <!-- Input chat -->
      <UInput
        type="text"
        :placeholder="`Nhắn #general`"
        v-model="messageText"
        color="neutral"
        variant="none"
        size="lg"
        class="flex-1 !bg-transparent !ring-0 text-[#dcddde] placeholder-[#72767d]"
      />

      <!-- Action buttons -->
      <div class="input-actions flex items-center space-x-2 ml-3">
        <UButton
          color="transparent"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="button"
        >
          <UIcon name="i-lucide-check-circle" class="w-5 h-5" />
        </UButton>

        <UButton
          color="transparent"
          size="sm"
          class="text-[#b9bbbe] hover:text-white"
          type="button"
        >
          <UIcon name="i-lucide-user" class="w-5 h-5" />
        </UButton>

        <!-- Nút gửi tin nhắn -->
        <UButton
          color="transparent"
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
