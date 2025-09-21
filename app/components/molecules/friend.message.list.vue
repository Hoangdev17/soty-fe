<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useMessageStore } from "~/stores/message/message.store";
import { navigateTo } from "#app";
import { storeToRefs } from "pinia";

const channelStore = useChannelStore();
const wsStore = useWebSocketStore();
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
  activeTab: "account", // default active tab
  users: [] as any[], // danh sách tất cả users
});

// Giả sử fetch users từ API
async function fetchUsers() {
  // TODO: implement fetch users
  state.value.users = []; // replace with actual fetch
}

const filteredUsers = computed(() => {
  if (!state.value.search) return state.value.users;
  return state.value.users.filter((user) =>
    user.label.toLowerCase().includes(state.value.search.toLowerCase())
  );
});

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

async function onCreateChannelDM(userIds: string[]) {
  if (userIds.length === 0) return;
  const channelDM = await channelStore.createChannelDm(userIds);
  navigateTo(`@me/${channelDM.id}`);
  state.value.isOpenModal = false;
  state.value.addedUsers = [];
}

// Computed property để tính unread count cho mỗi DM channel
const getUnreadCount = (channelId: string) => {
  return wsStore.unreadByChannel[channelId]?.size || 0;
};

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
        } catch (error) {
          console.warn(
            `⚠️ Failed to mark DM channel ${channel.id} as read:`,
            error
          );
        }
      }, 100); // Small delay to ensure navigation completes first
    } else {
      console.warn(
        `⚠️ Cannot mark channel ${channel.id} as read: no message ID found`
      );
    }
  }
};
</script>

<template>
  <div class="max-w-xs h-full flex flex-col gap-2">
    <!-- Button mở modal -->
    <UButton
      color="neutral"
      variant="subtle"
      block
      @click="state.isOpenModal = true"
    >
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
            :src="
              Array.isArray(channel.recipients) && channel.recipients[0]?.avatar
                ? channel.recipients[0].avatar
                : undefined
            "
            :alt="channel.name || 'DM Channel'"
            size="sm"
          />
          <span class="text-sm font-medium">
            {{
              channel.name ||
              (Array.isArray(channel.recipients)
                ? channel.recipients[0]?.username
                : undefined) ||
              "DM Channel"
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal thêm bạn -->
    <UModal v-model:open="state.isOpenModal" title="Thêm bạn bè">
      <template #body>
        <UInput v-model="state.search" placeholder="Search" class="w-full" />
        <div class="flex flex-col gap-2">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="flex items-center justify-between cursor-pointer gap-2"
          >
            <span>{{ user.label }}</span>
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
          <h4>Đã chọn:</h4>
          <div
            v-for="user in state.addedUsers"
            :key="user.id"
            class="flex items-center justify-between"
          >
            <span>{{ user.label }}</span>
            <UButton size="xs" color="error" @click="removeUser(user.id)">
              Xóa
            </UButton>
          </div>
        </div>
      </template>

      <template #footer>
        <UInput
          v-if="state.addedUsers.length > 1"
          v-model="state.groupName"
          placeholder="Tên nhóm (không bắt buộc)"
          class="w-full"
        />
        <UButton
          :label="state.addedUsers.length > 2 ? 'Tạo nhóm DM' : 'Tạo DM'"
          color="neutral"
          class="w-full"
          @click="onCreateChannelDM(state.addedUsers.map((u) => u.id))"
        />
      </template>
    </UModal>
  </div>
</template>
