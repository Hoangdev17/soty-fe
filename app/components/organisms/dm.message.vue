<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useRoute } from "vue-router";
import { useMessageStore } from "~/stores/message/message.store";

definePageMeta({
  layout: "main",
  middleware: ["required-auth"],
});

const messageStore = useMessageStore();

const route = useRoute();
const channelStore = useChannelStore();
const authStore = useAuthStore();

const channelId = computed(() => route.params.channel_id as string);
const isOpenUserProfile = ref(false);
const replyToMessage = ref(null);

const { currentChannel } = storeToRefs(channelStore);

// Get the other user in the DM (not the current user)
const dmRecipient = computed(() => {
  if (!currentChannel.value?.recipients) return null;

  if (Array.isArray(currentChannel.value.recipients)) {
    return currentChannel.value.recipients.find(
      (recipient) => recipient.id !== authStore.user?.id
    );
  }

  return currentChannel.value.recipients.id !== authStore.user?.id
    ? currentChannel.value.recipients
    : null;
});

console.log("dmrecipient", dmRecipient.value);

const hasMessages = computed(() => {
  const messages = messageStore.getMessagesByRoom(channelId.value);
  return messages && messages.length > 0;
});

const messageLoading = computed(() => messageStore.isLoading);

// Watch for channel changes and fetch messages
watch(channelId, async (newChannelId, oldChannelId) => {
  if (newChannelId && newChannelId !== oldChannelId) {
    try {
      await messageStore.fetchMessages(newChannelId);
      console.log("Messages loaded for new channel:", newChannelId);
    } catch (error) {
      console.error("Error loading messages for new channel:", error);
    }
  }
});

function toggleUserProfile() {
  isOpenUserProfile.value = !isOpenUserProfile.value;
}

function closeUserProfile() {
  isOpenUserProfile.value = false;
}

function handleReply(message: any) {
  replyToMessage.value = message;
}

function handleReplySent() {
  replyToMessage.value = null;
}

function handleReplyCancelled() {
  replyToMessage.value = null;
}

onMounted(async () => {
  if (channelId.value) {
    try {
      await messageStore.fetchMessages(channelId.value);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }
});
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
    <!-- Main Chat Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300 min-w-0"
      :class="{
        'mr-[320px]': isOpenUserProfile,
      }"
    >
      <!-- DM Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-3">
          <UAvatar
            :src="dmRecipient?.avatar"
            :alt="dmRecipient?.username || 'User'"
            size="sm"
            class="flex-shrink-0"
          />
          <div class="flex flex-col">
            <h1 class="text-white font-semibold truncate">
              {{ dmRecipient?.username || "Direct Message" }}
            </h1>
            <span class="text-xs text-gray-400"> Direct Message </span>
          </div>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
            @click="toggleUserProfile"
          >
            <UIcon name="i-lucide-user" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="flex-1 flex flex-col justify-end min-h-0 bg-dark-800">
        <!-- Welcome message -->
        <AtomsMessageLoading v-if="messageLoading" />
        <div
          v-if="!hasMessages"
          class="flex flex-col items-start text-left p-4"
        >
          <div class="flex items-center mb-4">
            <UAvatar
              :src="dmRecipient?.avatar"
              :alt="dmRecipient?.username || 'User'"
              size="lg"
              class="mr-3"
            />
          </div>
          <h2 class="text-white text-xl font-bold">
            Đây là cuộc trò chuyện với {{ dmRecipient?.username }}
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            Đây là nơi bắt đầu cuộc trò chuyện trực tiếp của bạn với
            {{ dmRecipient?.username }}.
          </p>
        </div>

        <!-- Message list -->
        <MoleculesMessageList
          v-if="hasMessages"
          :roomId="channelId"
          class="flex-1 min-h-0"
          @reply="handleReply"
        />
      </div>

      <!-- Message Input -->
      <div class="message-input-area p-2">
        <div
          class="transition-all duration-300"
          :class="{
            'max-w-full': !isOpenUserProfile,
            'max-w-4xl mx-auto': isOpenUserProfile,
          }"
        >
          <MoleculesMessageInput
            :channelId="channelId"
            :replyTo="replyToMessage"
            @reply-sent="handleReplySent"
            @reply-cancelled="handleReplyCancelled"
          />
        </div>
      </div>
    </div>

    <!-- User Profile Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenUserProfile && dmRecipient"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 p-4 overflow-y-auto z-50"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-user" class="w-5 h-5 mr-2" />
            User Profile
          </h3>
          <UButton
            @click="closeUserProfile"
            color="transparent"
            class="text-[#b9bbbe] hover:text-white p-1"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </UButton>
        </div>

        <!-- User Profile Content -->
        <div class="space-y-4">
          <!-- User Avatar and Basic Info -->
          <div
            class="flex flex-col items-center text-center p-4 bg-dark-700 rounded-lg"
          >
            <UAvatar
              :src="dmRecipient?.avatar"
              :alt="dmRecipient?.username"
              size="xl"
              class="mb-3"
            />
            <h4 class="text-white font-semibold text-lg">
              {{ dmRecipient?.username }}
            </h4>
            <p class="text-gray-400 text-sm">User ID: {{ dmRecipient?.id }}</p>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-2">
            <UButton
              color="neutral"
              variant="soft"
              block
              icon="i-lucide-message-circle"
            >
              Send Message
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              block
              icon="i-lucide-user-plus"
            >
              Add Friend
            </UButton>
            <UButton color="red" variant="soft" block icon="i-lucide-user-x">
              Block User
            </UButton>
          </div>

          <!-- Additional Info -->
          <div class="space-y-3">
            <div>
              <h5 class="text-white font-medium mb-2">About</h5>
              <p class="text-gray-400 text-sm">
                This is a direct message conversation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
