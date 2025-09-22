<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useRoleStore } from "~/stores/roles/role.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useMessageStore } from "~/stores/message/message.store";
import type { Channel } from "~/stores/channels/channel.type";
import ThreadPanel from "~/components/organisms/thread.panel.vue";
import PinnedMessagesPopover from "~/components/organisms/pinned.messages.popover.vue";
import ThreadListPopover from "~/components/organisms/thread.list.popover.vue";
import CreateThreadPanel from "~/components/organisms/create.thread.panel.vue";
import type { ContextMenuItem } from "@nuxt/ui";
import { onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useBreakpoint } from "~/composables/useBreakpoint.client";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  hasMessages: boolean;
  messageLoading: boolean;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();
const { isMobile } = useBreakpoint();

const items = ref<ContextMenuItem[][]>([
  [
    {
      label: "Hồ sơ",
      icon: "i-lucide-user",
    },
    {
      label: "Nhắn tin",
      icon: "i-lucide-message-circle",
    },
  ],
]);

const memberStore = useMemberStore();
const roleStore = useRoleStore();
const authStore = useAuthStore();
const route = useRoute();

// Add message store
const messageStore = useMessageStore();

// Global messages for unread tracking
const wsStore = useWebSocketStore();

// Expose unread count for template
const unreadCount = computed(() => wsStore.getUnreadCount(props.channelId));

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

// Local state for modal
const isMemberModalOpen = ref(false);

// Watch prop changes and update local state
watch(
  () => props.isOpenSlideoverMember,
  (newValue) => {
    isMemberModalOpen.value = newValue;
  },
  { immediate: true }
);

// Handle modal open/close events
const handleMemberModalUpdate = (value: boolean) => {
  isMemberModalOpen.value = value;
  if (!value) {
    emit("closeMemberPanel");
  }
};

// Track user activity for read receipts
const isUserActive = ref(false);
const activityTimeout = ref<NodeJS.Timeout | null>(null);

// Function to set user as active
const setUserActive = () => {
  isUserActive.value = true;

  // Clear existing timeout
  if (activityTimeout.value) {
    clearTimeout(activityTimeout.value);
  }

  // Set timeout to reset active state after 5 seconds of inactivity
  activityTimeout.value = setTimeout(() => {
    isUserActive.value = false;
  }, 5000);
};

// Function to reset user activity
const resetUserActivity = () => {
  isUserActive.value = false;
  if (activityTimeout.value) {
    clearTimeout(activityTimeout.value);
    activityTimeout.value = null;
  }
};

// Get last message ID from message store
const lastMessageId = computed(() => {
  const latestMessage = messageStore.getLatestMessage(props.channelId);
  return latestMessage?.id || null;
});

onMounted(() => {
  wsStore.restoreUnreadState();
});

// Function to send read receipt when opening channel
const sendReadReceiptForChannel = async () => {
  // Get last read message from localStorage first, then fallback to latest message
  const lastReadFromStorage = wsStore.getLastReadMessageId(props.channelId);
  const messageIdToSend = lastReadFromStorage || lastMessageId.value;

  if (props.channelId && messageIdToSend) {
    try {
      await wsStore.sendReadReceipt(props.channelId, messageIdToSend);
    } catch (error) {
      console.error("❌ Failed to send read receipt on channel open:", error);
    }
  }
};

onMounted(() => {
  sendReadReceiptForChannel();

  // If there are unread messages, also clear them immediately
  if (unreadCount.value > 0) {
    wsStore.clearUnread(props.channelId);
  }
});

// Handle scrolled to bottom from message list
const handleScrolledToBottom = async () => {
  if (props.channelId) {
    // When user scrolls to bottom, they've read all messages
    // Use last message ID or last read from cache
    const lastReadFromStorage = wsStore.getLastReadMessageId(props.channelId);
    const messageIdToSend = lastReadFromStorage || lastMessageId.value;

    if (messageIdToSend) {
      try {
        await wsStore.sendReadReceipt(props.channelId, messageIdToSend);
      } catch (error) {
        console.error(
          "❌ Failed to send read receipt on scroll to bottom:",
          error
        );
      }
    }
  }
};

// Watch channel change to mark as read
watch(
  () => props.channelId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      // Get last read message from localStorage first, then fallback to latest message
      const lastReadFromStorage = wsStore.getLastReadMessageId(newId);
      const messageIdToSend =
        lastReadFromStorage || messageStore.getLatestMessage(newId)?.id;

      if (messageIdToSend) {
        try {
          await wsStore.sendReadReceipt(newId, messageIdToSend);
        } catch (error) {
          console.error(
            "❌ Failed to send read receipt on channel switch:",
            error
          );
        }
      }
    }
  },
  { immediate: false }
);

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

// Handle user activity from message input
const handleUserActive = () => {
  setUserActive();
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

// Computed properties for members grouped by role
const guildMembers = computed(() => {
  if (!route.params.guild_id) return [];
  return memberStore.getMembersByGuild(route.params.guild_id as string);
});

const guildRoles = computed(() => {
  if (!route.params.guild_id) return [];
  return roleStore.getRolesByGuild(route.params.guild_id as string);
});

const membersByRole = computed(() => {
  if (!guildMembers.value.length || !guildRoles.value.length) return {};

  const result: Record<string, any[]> = {};

  // Sort roles by position (highest first), but with special handling for permissions
  const sortedRoles = [...guildRoles.value].sort((a, b) => {
    // Special case: @everyone should always be last regardless of position
    if (a.name === "@everyone") return 1;
    if (b.name === "@everyone") return -1;

    // Prioritize roles with ADMINISTRATOR permission
    const aHasAdmin = a.permissions?.includes("ADMINISTRATOR") || false;
    const bHasAdmin = b.permissions?.includes("ADMINISTRATOR") || false;

    if (aHasAdmin && !bHasAdmin) return -1;
    if (!aHasAdmin && bHasAdmin) return 1;

    // Then sort by position (highest first)
    return b.position - a.position;
  });

  // Initialize result with all roles
  sortedRoles.forEach((role) => {
    if (role.id) {
      result[role.id] = [];
    }
  });

  // Group members by their roles based on role.members array
  sortedRoles.forEach((role) => {
    if (!role.id || !role.members) return;

    role.members.forEach((roleMember: any) => {
      // Find the actual member object by memberId
      const member = guildMembers.value.find(
        (m) => m.id === roleMember.memberId
      );
      if (member && result[role.id]) {
        // Check if member is already in a higher priority role
        const alreadyAssigned = Object.keys(result).some((roleId) => {
          if (roleId === role.id) return false;
          const assignedRole = sortedRoles.find((r) => r.id === roleId);
          if (!assignedRole) return false;

          // Check if this role has higher priority
          const currentRoleIndex = sortedRoles.findIndex(
            (r) => r.id === role.id
          );
          const assignedRoleIndex = sortedRoles.findIndex(
            (r) => r.id === roleId
          );

          return (
            assignedRoleIndex < currentRoleIndex &&
            result[roleId] &&
            result[roleId].some((m) => m.id === member.id)
          );
        });

        if (!alreadyAssigned) {
          // Remove from lower priority roles
          Object.keys(result).forEach((roleId) => {
            if (roleId !== role.id && result[roleId]) {
              result[roleId] = result[roleId].filter((m) => m.id !== member.id);
            }
          });

          if (result[role.id]) {
            result[role.id]!.push(member);
          }
        }
      }
    });
  });

  return result;
});

// Get roles with members for display
const rolesWithMembers = computed(() => {
  const roles = guildRoles.value.filter((role) => {
    if (!role.id) return false;
    const roleMembers = membersByRole.value[role.id];
    return roleMembers && roleMembers.length > 0;
  });

  // Sort with same priority logic: ADMIN first, then position, @everyone last
  return roles.sort((a, b) => {
    // Special case: @everyone should always be last
    if (a.name === "@everyone") return 1;
    if (b.name === "@everyone") return -1;

    // Prioritize roles with ADMINISTRATOR permission
    const aHasAdmin = a.permissions?.includes("ADMINISTRATOR") || false;
    const bHasAdmin = b.permissions?.includes("ADMINISTRATOR") || false;

    if (aHasAdmin && !bHasAdmin) return -1;
    if (!aHasAdmin && bHasAdmin) return 1;

    // Then sort by position (highest first)
    return b.position - a.position;
  });
});

// Computed property to get member status
const getMemberStatus = (member: any) => {
  // You can customize this based on your member data structure
  // For now, return a default online status
  return {
    color: "success" as const,
    text: "●",
  };
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-800">
    <!-- Channel Header -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
    >
      <div class="flex items-center space-x-3">
        <UButton
          @click="$router.back()"
          variant="ghost"
          size="sm"
          class="text-[#b9bbbe] hover:text-white p-1"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        </UButton>
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-hash" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <UButton
          class="p-1 text-[#b9bbbe] hover:text-white"
          variant="ghost"
          @click="toggleMemberPanel"
        >
          <UIcon name="i-lucide-users-round" class="w-5 h-5" />
        </UButton>
      </div>
    </div>

    <!-- Messages Container -->
    <div
      class="flex-1 flex flex-col justify-end min-h-0 bg-dark-800 overflow-hidden"
    >
      <!-- Welcome message -->
      <AtomsMessageLoading v-if="messageLoading" />
      <div v-if="!hasMessages" class="flex flex-col items-start text-left p-4">
        <div class="flex items-center mb-4">
          <UIcon name="i-lucide-hash" class="w-8 h-8 text-[#72767d] mr-3" />
        </div>
        <h2 class="text-white text-xl font-bold">
          Chào mừng đến với kênh #{{ currentChannel?.name }}!
        </h2>
        <p class="text-[#72767d] text-base mb-4">
          Đây là nơi bắt đầu của kênh #{{ currentChannel?.name }}.
        </p>
      </div>

      <!-- Message list -->
      <MoleculesMessageList
        v-if="hasMessages"
        :roomId="channelId"
        class="flex-1 min-h-0"
        @reply="handleReply"
        @threadClick="handleThreadClick"
        @createThread="handleCreateThreadFromMessage"
        @scrolled-to-bottom="handleScrolledToBottom"
      />
    </div>

    <!-- Message Input -->
    <div class="message-input-area p-2">
      <MoleculesMessageInput
        :channelId="channelId"
        :replyTo="replyToMessage!"
        @reply-sent="handleReplySent"
        @reply-cancelled="handleReplyCancelled"
        @user-active="handleUserActive"
      />
    </div>

    <!-- Members Modal -->
    <UModal
      :open="isMemberModalOpen"
      @update:open="handleMemberModalUpdate"
      class="w-full h-full"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
            Hoạt động —
            {{
              memberStore.getMemberCount(
                (route.params.guild_id as string) || ""
              )
            }}
          </h3>
          <UButton
            @click="closeMemberPanel"
            variant="ghost"
            class="text-[#b9bbbe] hover:text-white p-1"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </UButton>
        </div>
      </template>

      <template #body>
        <div class="space-y-3">
          <!-- Members List -->
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

          <div v-else class="space-y-3">
            <!-- Display members grouped by role -->
            <div
              v-for="role in rolesWithMembers"
              :key="role.id"
              class="space-y-2"
            >
              <!-- Role header -->
              <div class="flex items-center gap-2 px-2 py-1">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: role.color }"
                ></div>
                <span
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {{ role.name }} — {{ membersByRole[role.id!]?.length || 0 }}
                </span>
              </div>

              <!-- Members in this role -->
              <UContextMenu
                :items="items"
                :ui="{
                  content: 'w-48',
                }"
                class="space-y-1 ml-2"
              >
                <div
                  v-for="member in membersByRole[role.id!]"
                  :key="member.id"
                  class="flex items-center gap-3 p-2 rounded-md hover:bg-dark-700 transition-colors"
                >
                  <UAvatar
                    :src="member.avatar"
                    :alt="member.nickname || member.user?.username"
                    size="md"
                    :chip="{
                      color: 'success',
                      position: 'bottom-right',
                    }"
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
                      <span>{{ member.user?.username }}</span>
                    </div>
                  </div>
                </div>
              </UContextMenu>
            </div>
          </div>
        </div>
      </template>
    </UModal>

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
  </div>
</template>

<style scoped>
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

/* Custom avatar chip positioning */
:deep(.u-avatar-chip) {
  bottom: 0 !important;
  right: 0 !important;
  transform: translate(25%, 25%) !important;
}

/* Status indicator styles */
.status-online {
  background-color: #23a559;
}

.status-offline {
  background-color: #80848e;
}

.status-idle {
  background-color: #f39c12;
}

.status-dnd {
  background-color: #f04747;
}
</style>
