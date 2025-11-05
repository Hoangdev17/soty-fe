<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useMessageStore } from "~/stores/message/message.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { navigateTo } from "#app";
import { storeToRefs } from "pinia";
import type { Channel } from "~/stores/channels/channel.type";
import { ChannelType } from "~/stores/channels/channel.type";

const channelStore = useChannelStore();
const wsStore = useWebSocketStore();
const authStore = useAuthStore();
const { channelDM } = storeToRefs(channelStore);
const route = useRoute();

onMounted(() => {
  channelStore.fetchChannelDMByUserId();
});

const state = ref({
  isOpenModal: false,
  addedUsers: [] as any[],
  search: "",
  groupName: "",
  groupIcon: "", // Icon URL for group DM
  activeTab: "account", // default active tab
  users: [] as any[], // danh sách tất cả users
  loading: false,
});

const filteredUsers = computed(() => {
  if (!state.value.search) return state.value.users;
  return state.value.users.filter((user) =>
    user.username.toLowerCase().includes(state.value.search.toLowerCase())
  );
});

// Fetch friends when opening modal
async function openModal() {
  state.value.isOpenModal = true;
  state.value.loading = true;

  try {
    await authStore.getUserFriendList();

    // Map friends to users list
    if (authStore.friends && authStore.friends.length > 0) {
      state.value.users = authStore.friends.map((friend) => ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch friends:", error);
  } finally {
    state.value.loading = false;
  }
}

function addUser(user: any) {
  if (!state.value.addedUsers.find((u) => u.id === user.id)) {
    state.value.addedUsers.push(user);
  }
}

function removeUser(userId: string) {
  state.value.addedUsers = state.value.addedUsers.filter(
    (u) => u.id !== userId
  );
}

// Handle icon upload
function handleIconUpload(url: string) {
  console.log("Uploaded icon URL:", url);
  state.value.groupIcon = url;
}

async function onCreateChannelDM(userIds: string[]) {
  if (userIds.length === 0) return;

  try {
    // For group DM (more than 1 user), pass icon and groupName if provided
    const isGroupDM = userIds.length > 1;

    const channelDM = await channelStore.createChannelDm(
      userIds,
      isGroupDM ? state.value.groupIcon || undefined : undefined,
      isGroupDM ? state.value.groupName || undefined : undefined
    );

    navigateTo(`/@me/${channelDM.id}`);

    // Reset state
    state.value.isOpenModal = false;
    state.value.addedUsers = [];
    state.value.groupName = "";
    state.value.groupIcon = "";
  } catch (error) {
    console.error("Failed to create DM channel:", error);
  }
}

// Computed property để track tất cả unread counts (cho reactivity)
const allUnreadCounts = computed(() => {
  const counts: Record<string, number> = {};
  if (channelDM.value) {
    channelDM.value.forEach((channel: any) => {
      if (channel.id) {
        counts[channel.id] = wsStore.unreadByChannel[channel.id]?.size || 0;
      }
    });
  }
  return counts;
});

// Function để handle click vào DM channel
const handleDMChannelClick = async (channel: any) => {
  // Navigate to channel first (don't await)
  navigateTo(`/@me/${channel.id}`);

  // Mark as read in background if channel has unread messages
  if ((allUnreadCounts.value[channel.id] || 0) > 0) {
    // Try to get last read message ID, or get the latest message from message store
    let lastReadMessageId = wsStore.getLastReadMessageId(channel.id);

    if (!lastReadMessageId) {
      // If no last read, get the latest message from message store
      const messageStore = useMessageStore();
      const messages = messageStore.messages[channel.id];
      if (messages && messages.length > 0) {
        // Get the last message ID
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.id) {
          lastReadMessageId = lastMessage.id;
        }
      }
    }

    if (lastReadMessageId) {
      // Mark as read in background without blocking navigation
      setTimeout(async () => {
        try {
          await wsStore.sendReadReceipt(channel.id, lastReadMessageId);
        } catch (error) {}
      }, 100); // Small delay to ensure navigation completes first
    } else {
    }
  }
};

// Helper function to get recipient info (excluding current user)
const getRecipient = (channel: Channel) => {
  if (!Array.isArray(channel.recipients) || channel.recipients.length === 0) {
    return null;
  }

  const currentUserId = authStore.user?.id;
  const recipient = channel.recipients.find((r) => r.id !== currentUserId);

  return recipient;
};

// Helper function to get display avatar - use channel icon for GROUP_DM, otherwise use recipient avatar
const getDisplayAvatar = (channel: Channel) => {
  if (channel.type === ChannelType.GROUP_DM) {
    return (channel as any).icon || null;
  }
  return getRecipient(channel)?.avatar || null;
};

// Helper function to get display name - use channel name for GROUP_DM, otherwise use recipient username
const getDisplayName = (channel: Channel) => {
  if (channel.type === ChannelType.GROUP_DM) {
    return channel.name || "Group Chat";
  }
  return getRecipient(channel)?.username || "DM Channel";
};
</script>

<template>
  <div class="max-w-xs h-full flex flex-col gap-2">
    <!-- Button mở modal -->
    <UButton color="neutral" variant="subtle" block @click="openModal">
      Thêm bạn bè
    </UButton>

    <!-- Danh sách Channel DM -->
    <div class="flex flex-col gap-2 flex-1 overflow-hidden">
      <h3 class="text-sm font-semibold">Direct Messages</h3>
      <div class="flex flex-col gap-2 overflow-y-auto max-h-96 scrollbar-hide">
        <div
          v-for="channel in channelDM"
          :key="channel.id"
          class="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-700 cursor-pointer transition"
          :class="{
            'bg-neutral-800 text-white': route.params.channel_id === channel.id,
            'text-neutral-400': route.params.id !== channel.id,
          }"
          @click="handleDMChannelClick(channel)"
        >
          <!-- Unread indicator bar -->
          <div
            v-if="(allUnreadCounts[channel.id] || 0) > 0"
            class="w-1 h-4 bg-white rounded-full flex-shrink-0"
          ></div>
          <!-- Spacer when no unread -->
          <div v-else class="w-1 flex-shrink-0"></div>

          <UAvatar
            :src="getDisplayAvatar(channel)!"
            :alt="getDisplayName(channel)"
            size="sm"
          />
          <span class="text-sm font-medium">
            {{ getDisplayName(channel) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal thêm bạn -->
    <UModal v-model:open="state.isOpenModal" title="Tạo tin nhắn nhóm">
      <template #body>
        <div v-if="state.loading" class="flex justify-center py-4">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          ></div>
        </div>
        <div v-else>
          <UInput
            v-model="state.search"
            placeholder="Tìm kiếm bạn bè..."
            class="w-full mb-4"
          />
          <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer gap-2"
            >
              <div class="flex items-center gap-2">
                <UAvatar :src="user.avatar" :alt="user.username" size="sm" />
                <span>{{ user.username }}</span>
              </div>
              <UButton
                size="xs"
                @click="addUser(user)"
                :disabled="state.addedUsers.some((u) => u.id === user.id)"
              >
                Thêm
              </UButton>
            </div>
          </div>
          <div v-if="state.addedUsers.length > 0" class="mt-4">
            <h4 class="font-semibold mb-2">Đã chọn:</h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="user in state.addedUsers"
                :key="user.id"
                class="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full"
              >
                <UAvatar :src="user.avatar" :alt="user.username" size="xs" />
                <span class="text-sm">{{ user.username }}</span>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-x"
                  @click="removeUser(user.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <!-- Group name and icon for group DM -->
          <div v-if="state.addedUsers.length > 1" class="space-y-2">
            <UInput
              v-model="state.groupName"
              placeholder="Tên nhóm (không bắt buộc)"
              class="w-full"
            />
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium"
                >Icon nhóm (không bắt buộc)</label
              >
              <div class="flex items-center gap-2">
                <UAvatar
                  v-if="state.groupIcon"
                  :src="state.groupIcon"
                  size="md"
                  alt="Group Icon"
                />
                <MoleculesUploadButton
                  @success="handleIconUpload"
                  accept="image/*"
                  label="Chọn icon"
                />
              </div>
            </div>
          </div>
          <UButton
            :label="
              state.addedUsers.length > 1 ? 'Tạo nhóm DM' : 'Tạo tin nhắn'
            "
            color="primary"
            block
            :disabled="state.addedUsers.length === 0"
            @click="onCreateChannelDM(state.addedUsers.map((u) => u.id))"
          >
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
