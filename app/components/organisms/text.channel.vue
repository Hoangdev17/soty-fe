<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useMessage } from "~/composables/useMessage";
import type { Channel } from "~/stores/channels/channel.type";
import ThreadPanel from "~/components/organisms/thread.panel.vue";
import PinnedMessagesPopover from "~/components/organisms/pinned.messages.popover.vue";
import ThreadListPopover from "~/components/organisms/thread.list.popover.vue";
import CreateThreadPanel from "~/components/organisms/create.thread.panel.vue";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  hasMessages: boolean;
  messageLoading: boolean;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();

const memberStore = useMemberStore();
const authStore = useAuthStore();
const route = useRoute();

// Reply state
const replyToMessage = ref(null);

// Thread panel state
const isThreadPanelOpen = ref(false);
const currentThreadId = ref("");
const isThreadPopoverOpen = ref(false);

// Create thread panel state
const isCreateThreadPanelOpen = ref(false);
const selectedMessageForThread = ref<any>(null);
const refreshMembers = async () => {
  const currentGuildId = route.params.guild_id as string;
  if (currentGuildId) {
    try {
      await memberStore.fetchMembersViaWebSocket(currentGuildId);
    } catch (error) {
      console.error("Failed to refresh members:", error);
    }
  }
};

const emit = defineEmits<{
  toggleMemberPanel: [];
  closeMemberPanel: [];
}>();

const toggleMemberPanel = () => {
  if (isThreadPanelOpen.value || isCreateThreadPanelOpen.value) {
    // Close thread panels when opening member panel
    isThreadPanelOpen.value = false;
    currentThreadId.value = "";
    isCreateThreadPanelOpen.value = false;
    selectedMessageForThread.value = null;
  }
  emit("toggleMemberPanel");
};

const closeMemberPanel = () => {
  emit("closeMemberPanel");
};

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

// Handle thread
const handleThreadClick = (threadId: string) => {
  // Close member panel when opening thread
  if (props.isOpenSlideoverMember) {
    closeMemberPanel();
  }
  // Close create thread panel if it's open
  if (isCreateThreadPanelOpen.value) {
    isCreateThreadPanelOpen.value = false;
    selectedMessageForThread.value = null;
  }
  // Close thread popover
  isThreadPopoverOpen.value = false;
  currentThreadId.value = threadId;
  isThreadPanelOpen.value = true;
};

const handleCloseThread = () => {
  isThreadPanelOpen.value = false;
  currentThreadId.value = "";
};

// Handle create thread
const handleCreateThread = () => {
  // Close member panel when opening create thread
  if (props.isOpenSlideoverMember) {
    closeMemberPanel();
  }
  // Close thread panel if it's open
  if (isThreadPanelOpen.value) {
    isThreadPanelOpen.value = false;
    currentThreadId.value = "";
  }
  // Close thread popover
  isThreadPopoverOpen.value = false;
  isCreateThreadPanelOpen.value = true;
};

const handleCloseCreateThread = () => {
  isCreateThreadPanelOpen.value = false;
  selectedMessageForThread.value = null;
};

const handleThreadCreated = (threadId: string) => {
  // Close create panel and open thread panel
  isCreateThreadPanelOpen.value = false;
  selectedMessageForThread.value = null;
  currentThreadId.value = threadId;
  isThreadPanelOpen.value = true;
};

// Handle create thread from message
const handleCreateThreadFromMessage = (message: any) => {
  // Close member panel when opening create thread
  if (props.isOpenSlideoverMember) {
    closeMemberPanel();
  }
  // Close thread panel if it's open
  if (isThreadPanelOpen.value) {
    isThreadPanelOpen.value = false;
    currentThreadId.value = "";
  }
  // Close thread popover
  isThreadPopoverOpen.value = false;
  selectedMessageForThread.value = message;
  isCreateThreadPanelOpen.value = true;
};
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
    <!-- Main Chat Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300 min-w-0"
      :class="{
        'mr-[320px]':
          isOpenSlideoverMember &&
          !isThreadPanelOpen &&
          !isCreateThreadPanelOpen,
        'mr-[400px]':
          !isOpenSlideoverMember &&
          (isThreadPanelOpen || isCreateThreadPanelOpen),
      }"
    >
      <!-- Channel Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-hash" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UPopover>
            <UButton
              class="p-1 text-[#b9bbbe] hover:text-white"
              color="transparent"
            >
              <UIcon name="i-lucide-pin" class="w-5 h-5" />
            </UButton>

            <template #content>
              <PinnedMessagesPopover :channelId="channelId" />
            </template>
          </UPopover>

          <UPopover v-model:open="isThreadPopoverOpen">
            <UButton
              class="p-1 text-[#b9bbbe] hover:text-white"
              color="transparent"
            >
              <UIcon name="i-lucide-spool" class="w-5 h-5" />
            </UButton>

            <template #content>
              <ThreadListPopover
                :channelId="channelId"
                @threadClick="handleThreadClick"
                @createThread="handleCreateThread"
              />
            </template>
          </UPopover>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            color="transparent"
            @click="toggleMemberPanel"
          >
            <UIcon name="i-lucide-users-round" class="w-5 h-5" />
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
            <UIcon name="i-lucide-hash" class="w-8 h-8 text-[#72767d] mr-3" />
          </div>
          <h2 class="text-white text-xl font-bold">
            Chào mừng đến với kênh #{{ currentChannel?.name }}!
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            Đây là nơi bắt đầu của kênh #{{ currentChannel?.name }}.
          </p>
          <UButton icon="i-lucide-pencil" variant="ghost" color="info">
            Chỉnh sửa kênh
          </UButton>
        </div>

        <!-- Message list - takes remaining space and handles its own scrolling -->
        <MoleculesMessageList
          v-if="hasMessages"
          :roomId="channelId"
          class="flex-1 min-h-0"
          @reply="handleReply"
          @threadClick="handleThreadClick"
          @createThread="handleCreateThreadFromMessage"
        />
      </div>

      <div class="message-input-area p-2">
        <div
          class="transition-all duration-300"
          :class="{
            'max-w-full':
              !isOpenSlideoverMember &&
              !isThreadPanelOpen &&
              !isCreateThreadPanelOpen,
            'max-w-4xl mx-auto': isOpenSlideoverMember || isThreadPanelOpen,
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
      <!-- Message Input -->
    </div>

    <!-- Members Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenSlideoverMember"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 p-4 overflow-y-auto z-50"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
            Hoạt động —
            {{
              memberStore.getMemberCount(
                (route.params.guild_id as string) || ""
              )
            }}
          </h3>
          <div class="flex items-center gap-2">
            <UButton
              @click="refreshMembers"
              color="transparent"
              class="text-[#b9bbbe] hover:text-white p-1"
              :loading="memberStore.isLoading"
              size="sm"
            >
              <UIcon name="i-lucide-refresh-ccw" class="w-4 h-4" />
            </UButton>
            <UButton
              @click="closeMemberPanel"
              color="transparent"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>
        </div>

        <!-- Members List -->
        <div class="space-y-2">
          <div v-if="memberStore.isLoading" class="text-center py-4">
            <UIcon
              name="i-lucide-loader-2"
              class="w-6 h-6 animate-spin mx-auto text-gray-400"
            />
            <p class="text-gray-400 text-sm mt-2">Đang tải...</p>
          </div>

          <div v-else-if="memberStore.getError" class="text-center py-4">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-6 h-6 mx-auto text-red-400"
            />
            <p class="text-red-400 text-sm mt-2">{{ memberStore.getError }}</p>
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="member in memberStore.getMembersByGuild(route.params.guild_id as string || '')"
              :key="member.id"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-dark-700 transition-colors"
            >
              <UAvatar
                :src="member.avatar"
                :alt="member.nickname || member.user?.username"
                size="sm"
                class="flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-white font-medium text-sm truncate">
                    {{ member.nickname || member.user?.username }}
                  </span>
                  <span
                    v-if="member.user?.id === authStore.user?.id"
                    class="text-xs text-green-400 font-medium"
                  >
                    Bạn
                  </span>
                </div>
                <div class="flex items-center gap-1 text-xs text-gray-400">
                  <UIcon
                    name="i-lucide-crown"
                    v-if="member.permissions?.includes('ADMIN')"
                    class="w-3 h-3 text-yellow-400"
                  />
                  <span>{{ member.user?.username }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Thread Panel -->
  <ThreadPanel
    :threadId="currentThreadId"
    :isOpen="isThreadPanelOpen"
    @close="handleCloseThread"
  />

  <!-- Create Thread Panel -->
  <CreateThreadPanel
    :isOpen="isCreateThreadPanelOpen"
    :channelId="channelId"
    :starterMessageId="selectedMessageForThread?.id"
    :starterMessageContent="selectedMessageForThread?.content"
    @close="handleCloseCreateThread"
    @threadCreated="handleThreadCreated"
  />
</template>

<style scoped>
.channel-page {
  color: #dcddde;
  /* Make the chat page fill the viewport and prevent the page itself from scrolling */
  height: 100vh;
  overflow: hidden;
}

.mention {
  background-color: rgba(88, 101, 242, 0.3);
  padding: 0 2px;
  border-radius: 3px;
}

.message-group:hover {
  background-color: #32353b;
}

.reaction:hover {
  background-color: #40444b;
}

.input-wrapper input:focus {
  outline: none;
}

.username.text-\[#00d4aa\] {
  color: #00d4aa;
}

.username.text-\[#ed4245\] {
  color: #ed4245;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Ensure the immediate flex child can shrink so inner flex children can scroll */
.channel-page > .flex-1 {
  min-height: 0;
}
</style>
