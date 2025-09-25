<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import InviteModal from "~/components/molecules/invite.modal.vue";
import CreateCategoryModal from "~/components/molecules/create.category.modal.vue";
import CreateChannelModal from "~/components/molecules/create.channel.modal.vue";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useRoleStore } from "~/stores/roles/role.store";
import { useMemberStore } from "~/stores/member/member.store";
import { useMessageStore } from "~/stores/message/message.store";
import type { Member } from "~/stores/member/member.type";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import ModalEventCommunity from "./modal.event.community.vue";

const route = useRoute();
const communityStore = useCommunityStore();
const channelStore = useChannelStore();
const authStore = useAuthStore();
const roleStore = useRoleStore();
const memberStore = useMemberStore();
const messageStore = useMessageStore();
const wsStore = useWebSocketStore();

const guildId = ref(route.params.guild_id as string | undefined);
const { currentCommunity } = storeToRefs(communityStore);

const isInviteModalOpen = ref(false);
const isCreateCategoryModalOpen = ref(false);
const isCreateChannelModalOpen = ref(false);
const selectedCategoryId = ref<string>("");
const expandedCategories = ref<Set<string>>(new Set());
const serverName = ref(communityStore.currentCommunity?.name || "My Server");
const showDropdown = ref(false);
const isOpenEvent = ref(false);

function handleOpenModalEvent() {
  isOpenEvent.value = true;
}

const itemsNavigates = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "Sự kiện",
      icon: "i-lucide-users",
      disabled: !communityStore.currentCommunity || !isMember.value,
      onSelect: () => {
        // Mở modal sự kiện
        handleOpenModalEvent();
      },
    },
    {
      label: "Nâng cấp máy chủ",
      icon: "i-lucide-store",
      to:
        "/community/@" +
        currentCommunity.value?.name +
        "-" +
        currentCommunity.value?.id +
        "/boots",
      disabled: false,
    },
    {
      label: "Giới thiệu về community",
      icon: "i-lucide-store",
      to: "/community/introduce/" + currentCommunity.value?.id,
      disabled: false,
    },
  ],
]);

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Nâng cấp máy chủ",
      type: "label",
    },
  ],
  [
    {
      label: "Mời mọi người",
      icon: "i-lucide-user-plus",
      onSelect: () => {
        if (!isMember.value) return;
        isInviteModalOpen.value = true;
      },
      disabled: !communityStore.currentCommunity || !isMember.value,
    },
    ...(canManageServer.value
      ? [
          {
            label: "Cài đặt máy chủ",
            icon: "i-lucide-settings",
            to: communityStore.currentCommunity
              ? `/community/@${communityStore.currentCommunity.name}-${communityStore.currentCommunity.id}/settings`
              : undefined,
            disabled: !communityStore.currentCommunity,
          },
        ]
      : []),
    ...(canManageServer.value
      ? [
          {
            label: "Tạo kênh",
            icon: "i-lucide-circle-plus",
            onSelect: () => {
              openCreateChannelModal();
            },
            disabled: !communityStore.currentCommunity || !isMember.value,
          },
        ]
      : []),

    ...(canManageServer.value
      ? [
          {
            label: "Tạo danh mục",
            icon: "i-lucide-folder-plus",
            onSelect: () => {
              openCreateCategoryModal();
            },
            disabled: !communityStore.currentCommunity || !isMember.value,
          },
        ]
      : []),
    ...(canManageServer.value
      ? [
          {
            label: "Tạo sự kiện",
            icon: "i-lucide-calendar-1",
            onSelect: () => {},
            // disabled: !communityStore.currentCommunity || !isMember.value,
            disabled: true,
          },
        ]
      : []),
    {
      label: "Thư mục App",
      icon: "i-lucide-gamepad-2",
      // disabled: !communityStore.currentCommunity || !isMember.value,
      disabled: true,
    },
  ],
  [
    {
      label: "Cài đặt thông báo",
      icon: "i-lucide-bell-ring",
      // disabled: !communityStore.currentCommunity || !isMember.value,
      disabled: true,
    },
  ],
]);

onMounted(async () => {
  if (communityStore?.currentCommunity?.id) {
    // Chỉ fetch channels nếu chưa có channels (tránh override từ fetchCommunityById)
    if (!channelStore.channels || channelStore.channels.length === 0) {
      await channelStore.fetchAllChannelsByGuildId(
        communityStore.currentCommunity.id
      );
    }

    // Fetch unread counts for all channels in this community
    try {
      const { getCommunityChannelsUnreadCount } = await import(
        "~/stores/message/message.action"
      );
      const unreadData = await getCommunityChannelsUnreadCount(
        communityStore.currentCommunity.id
      );

      // Sync unread counts with WebSocket store
      if (unreadData.channels) {
        wsStore.syncUnreadCountsFromAPI(unreadData.channels);
      }
    } catch (error) {
      console.error(
        "❌ Failed to fetch community channels unread count:",
        error
      );
    }
  }

  // Initialize expanded categories
  if (channelStore.channels) {
    const categories = channelStore.channels.filter(
      (c: any) => c.type === "GUILD_CATEGORY"
    );
    categories.forEach((category: any) => {
      expandedCategories.value.add(category.id);
    });
    expandedCategories.value = new Set(expandedCategories.value);
  }

  setTimeout(() => {
    // Ensure unread state is restored
    wsStore.restoreUnreadState();

    // Flag to track if unread state has been restored
    let unreadStateRestored = false;

    // Watch for message store changes to restore unread state
    watch(
      () => messageStore.messages,
      (newMessages) => {
        if (
          newMessages &&
          Object.keys(newMessages).length > 0 &&
          !unreadStateRestored
        ) {
          wsStore.restoreUnreadState();
          unreadStateRestored = true;
        }
      },
      { immediate: true, deep: true }
    );

    // Also try to restore immediately in case messages are already loaded
    setTimeout(() => {
      if (
        messageStore.messages &&
        Object.keys(messageStore.messages).length > 0 &&
        !unreadStateRestored
      ) {
        wsStore.restoreUnreadState();
        unreadStateRestored = true;
      }
    }, 1000);
  }, 500);
});

const toggleCategory = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }

  expandedCategories.value = new Set(expandedCategories.value);
};

// Function to check if category is expanded
const isCategoryExpanded = (categoryId: string) => {
  return expandedCategories.value.has(categoryId);
};

// Function to get current channel ID from route
const getCurrentChannelId = () => {
  const pathParts = route.path.split("/");
  return pathParts[pathParts.length - 1];
};

// Computed property for current channel ID
const currentChannelId = computed(() => {
  return getCurrentChannelId();
});

// Handle dropdown menu item clicks
const handleMenuClick = (item: any) => {
  if (item.disabled) return;

  showDropdown.value = false; // Close dropdown

  if (item.onSelect) {
    item.onSelect();
  } else if (item.to && communityStore.currentCommunity) {
    navigateTo(item.to);
  }
};

// Watch for currentCommunity changes
watch(
  () => communityStore.currentCommunity,
  (newCommunity) => {
    serverName.value = newCommunity?.name || "My Server";
  },
  { immediate: true }
);

// Close dropdown when clicking outside - handler declared at setup scope
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element;
  const dropdownContainer = target.closest(".relative");
  const header = target.closest("header");

  // Nếu click không phải trong dropdown container hoặc header thì đóng dropdown
  if (!dropdownContainer && !header) {
    showDropdown.value = false;
  }
};

// Computed properties
const isMember = computed(() => {
  if (!communityStore.currentCommunity?.id || !authStore.user?.id) {
    return false;
  }

  const guildId = communityStore.currentCommunity.id;
  const userId = authStore.user.id;

  // Get all members for this guild
  const members = memberStore.getMembersByGuild(guildId);

  // Check if user is a member
  return members.some((member: Member) => member.user?.id === userId);
});

const canManageServer = computed(() => {
  if (!communityStore.currentCommunity?.id || !authStore.user?.id) {
    return false;
  }

  const guildId = communityStore.currentCommunity.id;
  const userId = authStore.user.id;

  // Lấy member object an toàn
  const membersList = memberStore.getMembersByGuild(guildId) || [];
  const member = membersList.find((m: Member) => m.userId === userId);
  const memberId = member?.id;

  if (!memberId) return false;

  // đảm bảo luôn là mảng
  const allRoles = roleStore.getRolesByGuild(guildId) || [];

  const userRoles = allRoles.filter((role: any) => {
    const roleMembers = role?.members || [];
    return roleMembers.some((member: any) => {
      return member?.memberId === memberId;
    });
  });

  // đảm bảo permissions tồn tại trước khi gọi includes
  const hasPermission = userRoles.some(
    (role: any) =>
      (role?.permissions || []).includes("ADMINISTRATOR") ||
      (role?.permissions || []).includes("MANAGE_GUILD")
  );

  return hasPermission;
});

// Watch for channels changes to update expanded categories
watch(
  () => channelStore.channels,
  (newChannels) => {
    if (newChannels && newChannels.length > 0) {
      const categories = newChannels.filter(
        (c: any) => c.type === "GUILD_CATEGORY"
      );
      const newExpanded = new Set(expandedCategories.value);

      categories.forEach((category: any) => {
        newExpanded.add(category.id);
      });

      expandedCategories.value = newExpanded;
    }
  },
  { immediate: true }
);

// Function to get icon for channel type
const getChannelIcon = (channelType: string) => {
  switch (channelType) {
    case "GUILD_TEXT":
      return "i-lucide-hash";
    case "GUILD_VOICE":
      return "i-lucide-volume-2";
    case "GUILD_PUBLIC_THREAD":
    case "GUILD_PRIVATE_THREAD":
    case "GUILD_NEWS_THREAD":
      return "i-lucide-message-circle";
    case "GUILD_NEWS":
      return "i-lucide-newspaper";
    case "GUILD_STAGE_VOICE":
      return "i-lucide-mic";
    case "GUILD_FORUM":
      return "i-lucide-message-square";
    case "GUILD_CATEGORY":
      return "i-lucide-folder";
    case "DM":
      return "i-lucide-message-square";
    case "GROUP_DM":
      return "i-lucide-users";
    default:
      return "i-lucide-hash";
  }
};

const itemsChannel = computed<NavigationMenuItem[][]>(() => {
  if (
    !channelStore.channels ||
    channelStore.channels.length === 0 ||
    !isMember.value
  ) {
    return [];
  }

  // Separate categories and channels
  const categories = channelStore.channels.filter(
    (channel: any) => channel.type === "GUILD_CATEGORY"
  );
  const channels = channelStore.channels.filter(
    (channel: any) => channel.type !== "GUILD_CATEGORY"
  );

  const channelItems: NavigationMenuItem[] = [];

  // Group channels by category
  const channelsByCategory = channels.reduce((acc: any, channel: any) => {
    const categoryId = channel.parentId || "no-category";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(channel);
    return acc;
  }, {});

  // Sort categories by position
  const sortedCategories = categories.sort(
    (a: any, b: any) => (a.position || 0) - (b.position || 0)
  );

  // Add channels without category first
  if (channelsByCategory["no-category"]) {
    channelsByCategory["no-category"]
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .forEach((channel: any) => {
        channelItems.push({
          label: channel.name || "Kênh không tên",
          icon: getChannelIcon(channel.type),
          to: `/community/@${communityStore.currentCommunity?.name}-${communityStore.currentCommunity?.id}/${channel.id}`,
        });
      });
  }

  // Add categories with their channels
  sortedCategories.forEach((category: any) => {
    // Add category header (not clickable)
    channelItems.push({
      label: category.name,
      icon: getChannelIcon(category.type),
      disabled: true,
      class:
        "category-header font-semibold text-gray-400 text-xs uppercase tracking-wider",
    });

    // Add channels in this category
    if (channelsByCategory[category.id]) {
      channelsByCategory[category.id]
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .forEach((channel: any) => {
          channelItems.push({
            label: channel.name || "Kênh không tên",
            icon: getChannelIcon(channel.type),
            to: `/community/@${communityStore.currentCommunity?.name}-${communityStore.currentCommunity?.id}/${channel.id}`,
            class: "channel-item ml-4",
          });
        });
    }
  });

  return [channelItems];
});

// Hàm mở modal
const openCreateChannelModal = () => {
  if (!isMember.value) return; // Only allow members to create channels
  selectedCategoryId.value = ""; // Reset category selection
  isCreateChannelModalOpen.value = true;
};

const openCreateChannelInCategory = (categoryId: string) => {
  if (!isMember.value) return;
  selectedCategoryId.value = categoryId;
  isCreateChannelModalOpen.value = true;
};

const openCreateCategoryModal = () => {
  if (!isMember.value) return; // Only allow members to create categories
  isCreateCategoryModalOpen.value = true;
};

// Callback functions for modal events
const onCategoryCreated = (category: any) => {};

const onChannelCreated = (channel: any) => {};

// Computed properties for channel hierarchy
const channelsWithoutCategory = computed(() => {
  if (!channelStore.channels || !isMember.value) return [];

  return channelStore.channels
    .filter(
      (channel: any) =>
        channel.type !== "GUILD_CATEGORY" &&
        (!channel.parentId || channel.parentId === null)
    )
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
});

const sortedCategories = computed(() => {
  if (!channelStore.channels || !isMember.value) return [];

  return channelStore.channels
    .filter((channel: any) => channel.type === "GUILD_CATEGORY")
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
});

// Get unread count for a channel (reactive version)
const getUnreadCount = (channelId: string) => {
  // Access the reactive object directly to trigger reactivity
  const count = wsStore.unreadByChannel[channelId]?.size || 0;
  return count;
};

// Computed property to track all unread counts (for reactivity)
const allUnreadCounts = computed(() => {
  const counts: Record<string, number> = {};
  if (channelStore.channels) {
    channelStore.channels.forEach((channel: any) => {
      if (channel.id) {
        // Access reactive object directly in computed
        counts[channel.id] = wsStore.unreadByChannel[channel.id]?.size || 0;
      }
    });
  }
  return counts;
});

// Watch for unread changes to debug
watch(
  () => wsStore.unreadByChannel,
  (newUnread) => {},
  { deep: true, immediate: true }
);

// Methods for channel navigation and context menus
const navigateToChannel = (channel: any) => {
  if (!communityStore.currentCommunity) return;

  const url = `/community/@${communityStore.currentCommunity.name}-${communityStore.currentCommunity.id}/${channel.id}`;
  navigateTo(url);

  // Update current channel
  channelStore.currentChannel = channel;

  // Expand category if channel is in one
  if (channel.parentId) {
    expandedCategories.value.add(channel.parentId);
    expandedCategories.value = new Set(expandedCategories.value);
  }
};

const getChannelsInCategory = (categoryId: string) => {
  if (!channelStore.channels) return [];

  return channelStore.channels
    .filter(
      (channel: any) =>
        channel.type !== "GUILD_CATEGORY" && channel.parentId === categoryId
    )
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
};

const showCategoryContextMenu = (event: MouseEvent, categoryId: string) => {
  openCreateChannelInCategory(categoryId);
};

const { isMobile } = useBreakpoint();

// Voice presence tracking: map of channelId -> number of users
const voicePresence = ref<Record<string, number>>({});
// Voice users map: roomId -> array of user objects
const voiceUsers = ref<Record<string, any[]>>({});
const _pendingRoomQueue = ref<string[]>([]);

// Debug for sidebar: capture recent room-users payloads
const socketDebugEventsSidebar = ref<Array<{ t: number; payload: any }>>([]);
const showSidebarDebug = ref(false);

onMounted(() => {
  try {
    if (typeof window !== "undefined" && window.location.search) {
      showSidebarDebug.value = String(window.location.search).includes(
        "voice_debug=1"
      );
    }
  } catch (e) {
    showSidebarDebug.value = false;
  }
});

function handleRoomUsersForSidebar(payload: any) {
  // The backend responds with { users } (without roomId), so we consume from the pending queue in order
  const roomId = _pendingRoomQueue.value.shift();
  if (!roomId) return;
  const users = (payload && payload.users) || payload || [];
  const count = Array.isArray(users) ? users.length : 0;
  // Filter out the local user so the sidebar doesn't show you as present unless you're actually in the room
  const localUserId = authStore.user?.id ?? null;
  const localSocketId = wsStore.connection?.id ?? null;
  let filteredUsers = Array.isArray(users) ? users.slice() : [];
  filteredUsers = filteredUsers.filter((u: any) => {
    if (!u) return false;
    const matchesId =
      localUserId &&
      (u.id === localUserId || String(u.id) === String(localUserId));
    const matchesSocket =
      localSocketId &&
      (u.socketId === localSocketId ||
        String(u.socketId) === String(localSocketId));
    // Exclude local user by default
    return !(matchesId || matchesSocket);
  });

  const key = String(roomId);
  voicePresence.value = { ...voicePresence.value, [key]: filteredUsers.length };
  try {
    voiceUsers.value = { ...voiceUsers.value, [key]: filteredUsers };
  } catch (e) {}
  // debug
  try {
    socketDebugEventsSidebar.value.unshift({
      t: Date.now(),
      payload: { roomId, users },
    });
    if (socketDebugEventsSidebar.value.length > 30)
      socketDebugEventsSidebar.value.pop();
    console.debug("sidebar room-users for", roomId, users);
  } catch (e) {
    // ignore
  }
}

function handleChannelPresence(payload: any) {
  try {
    const roomId = payload?.roomId;
    const usersCount =
      typeof payload?.usersCount === "number"
        ? payload.usersCount
        : Array.isArray(payload?.users)
        ? payload.users.length
        : 0;
    if (!roomId) return;
    const key = String(roomId);
    voicePresence.value = { ...voicePresence.value, [key]: usersCount };
    // Store users if provided
    if (Array.isArray(payload?.users)) {
      voiceUsers.value = { ...voiceUsers.value, [key]: payload.users };
    }
    // Log to debug panel
    socketDebugEventsSidebar.value.unshift({
      t: Date.now(),
      payload: {
        event: "channel-presence",
        roomId: key,
        usersCount,
        users: payload?.users,
      },
    });
    if (socketDebugEventsSidebar.value.length > 30)
      socketDebugEventsSidebar.value.pop();
    console.debug("sidebar channel-presence", roomId, usersCount);
  } catch (e) {
    console.debug("error handling channel-presence", e);
  }
}

async function refreshVoicePresence() {
  if (!channelStore.channels) return;
  // gather voice-like channels
  const voiceChannels = channelStore.channels.filter(
    (c: any) => c.type === "GUILD_VOICE" || c.type === "GUILD_STAGE_VOICE"
  );

  // reset
  voicePresence.value = {};
  _pendingRoomQueue.value = [];

  // Ensure socket connection
  if (!wsStore.connection) {
    console.debug("refreshVoicePresence: websocket not connected");
    return;
  }

  // Request users sequentially to map responses to requested room IDs
  for (const c of voiceChannels) {
    const roomId = c.id;
    _pendingRoomQueue.value.push(roomId);
    try {
      console.debug("emit get-room-users for", roomId);
      wsStore.connection.emit("get-room-users", { roomId });
    } catch (e) {
      console.debug("emit failed for", roomId, e);
    }
    // small delay to avoid flooding and keep response order
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 40));
  }
}

// Attach listener to socket connection for room-users responses
watch(
  () => wsStore.connection,
  (conn) => {
    if (conn) {
      try {
        conn.on("room-users", handleRoomUsersForSidebar);
        console.debug("sidebar registered room-users handler");
      } catch (e) {
        console.debug("sidebar failed to register room-users handler", e);
      }
      try {
        conn.on("channel-presence", handleChannelPresence);
        console.debug("sidebar registered channel-presence handler");
      } catch (e) {
        console.debug("sidebar failed to register channel-presence handler", e);
      }
      // Kick off a refresh when socket becomes available
      console.debug("sidebar socket connected, refreshing voice presence");
      refreshVoicePresence().catch((err) => console.debug(err));
    } else {
      try {
        // remove listener if existed
        wsStore.connection?.off("room-users", handleRoomUsersForSidebar);
        wsStore.connection?.off("channel-presence", handleChannelPresence);
      } catch (e) {}
    }
  },
  { immediate: true }
);

// Re-request presence when channels change
watch(
  () => channelStore.channels,
  (newChannels) => {
    refreshVoicePresence().catch(() => {});
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="flex flex-col h-full bg-dark-800 text-white relative"
    :class="isMobile ? 'w-full' : 'w-60'"
  >
    <!-- Header section with Discord-style colors -->
    <div class="flex-shrink-0 px-4 pt-4 pb-1 border-[#202225] border-b">
      <!-- Server Header -->
      <div class="relative">
        <header
          class="flex items-center justify-between text-gray-200 rounded-md transition-colors cursor-pointer hover:bg-gray-600/30 px-2 py-1"
          @click.stop="showDropdown = !showDropdown"
        >
          <span class="font-medium text-base truncate">{{ serverName }}</span>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': showDropdown }"
            />
            <button
              v-if="showSidebarDebug"
              @click.stop.prevent="refreshVoicePresence"
              class="text-xs text-gray-300 hover:text-white px-2 py-1 rounded"
              title="Refresh voice presence"
            >
              Refresh voice
            </button>
          </div>
        </header>

        <!-- Dropdown Menu -->
        <div
          v-if="showDropdown"
          class="absolute top-full left-0 right-0 mt-1 z-50"
          @click.stop
        >
          <div
            class="bg-gray-800 rounded-md border border-gray-600 shadow-xl overflow-hidden"
          >
            <template v-for="(group, groupIndex) in items" :key="groupIndex">
              <div v-if="groupIndex > 0" class="border-t border-gray-600"></div>
              <div v-for="item in group" :key="item.label" class="p-1">
                <div
                  v-if="item.type === 'label'"
                  class="px-3 py-2 text-xs text-gray-400 uppercase font-semibold"
                >
                  {{ item.label }}
                </div>
                <button
                  v-else
                  @click="handleMenuClick(item)"
                  :disabled="item.disabled"
                  class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-gray-600/50 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-200"
                >
                  <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
                  {{ item.label }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation section -->
    <div class="flex-shrink-0 px-4 pb-2">
      <UNavigationMenu
        orientation="vertical"
        :items="itemsNavigates"
        class="mt-2"
      />
      <USeparator class="my-2" />
    </div>

    <!-- Scrollable channels section -->
    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <div class="px-4 pb-20">
        <!-- Custom channel hierarchy -->
        <div
          v-if="
            channelStore.channels &&
            channelStore.channels.length > 0 &&
            isMember
          "
          class="space-y-1"
        >
          <!-- Channels without category -->
          <template
            v-for="channel in channelsWithoutCategory"
            :key="channel.id"
          >
            <div
              class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-600/30 cursor-pointer group transition-colors"
              :class="{
                'bg-white/10 text-white': currentChannelId === channel.id,
              }"
              @click="navigateToChannel(channel)"
            >
              <!-- Unread indicator bar -->
              <div
                v-if="(allUnreadCounts[channel.id] || 0) > 0"
                class="w-1 h-4 bg-white rounded-full flex-shrink-0"
              ></div>
              <!-- Spacer when no unread -->
              <div v-else class="w-1 flex-shrink-0"></div>

              <UIcon
                :name="getChannelIcon(channel.type)"
                class="w-4 h-4 text-gray-400"
                :class="{ 'text-white': currentChannelId === channel.id }"
              />
              <span
                class="text-gray-200 text-sm truncate"
                :class="{ 'text-white': currentChannelId === channel.id }"
                >{{ channel.name }}</span
              >
              <!-- Voice avatar stack -->
              <div
                v-if="(voicePresence[channel.id] || 0) > 0"
                class="ml-auto flex items-center gap-2"
              >
                <div class="flex -space-x-2 items-center">
                  <template
                    v-for="(u, idx) in (voiceUsers[channel.id] || []).slice(
                      0,
                      3
                    )"
                    :key="u.socketId || idx"
                  >
                    <img
                      :src="u.avatar"
                      :alt="u.username"
                      class="w-5 h-5 rounded-full ring-2 ring-dark-800 border border-black"
                      :title="u.username"
                    />
                  </template>
                </div>
                <div class="text-xs text-green-400 font-semibold">
                  {{ voicePresence[channel.id] }}
                </div>
              </div>
            </div>
          </template>

          <!-- Categories with their channels -->
          <template v-for="category in sortedCategories" :key="category.id">
            <div class="mt-4 first:mt-0">
              <!-- Category header -->
              <div
                class="flex items-center justify-between px-2 py-1 group hover:bg-gray-600/20 rounded cursor-pointer"
                @click="toggleCategory(category.id)"
                @contextmenu.prevent="
                  showCategoryContextMenu($event, category.id)
                "
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="w-3 h-3 text-gray-500 transition-transform"
                    :class="{ 'rotate-180': !isCategoryExpanded(category.id) }"
                  />
                  <span
                    class="text-xs uppercase font-semibold text-gray-400 tracking-wider"
                  >
                    {{ category.name }}
                  </span>
                </div>
                <UIcon
                  name="i-lucide-plus"
                  class="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-gray-300"
                  @click.stop="openCreateChannelInCategory(category.id)"
                />
              </div>

              <!-- Channels in this category -->
              <template
                v-for="channel in getChannelsInCategory(category.id)"
                :key="channel.id"
              >
                <div
                  v-show="isCategoryExpanded(category.id)"
                  class="flex items-center gap-2 px-6 py-1 rounded hover:bg-gray-600/30 cursor-pointer group transition-colors ml-2"
                  :class="{
                    'bg-white/10 text-white': currentChannelId === channel.id,
                  }"
                  @click="navigateToChannel(channel)"
                >
                  <!-- Unread indicator bar -->
                  <div
                    v-if="getUnreadCount(channel.id) > 0"
                    class="w-1 h-4 bg-white rounded-full flex-shrink-0"
                  ></div>
                  <!-- Spacer when no unread -->
                  <div v-else class="w-1 flex-shrink-0"></div>

                  <UIcon
                    :name="getChannelIcon(channel.type)"
                    class="w-4 h-4 text-gray-400"
                    :class="{ 'text-white': currentChannelId === channel.id }"
                  />
                  <span
                    class="text-gray-200 text-sm truncate"
                    :class="{ 'text-white': currentChannelId === channel.id }"
                    >{{ channel.name }}</span
                  >
                  <!-- Voice avatar stack -->
                  <div
                    v-if="(voicePresence[channel.id] || 0) > 0"
                    class="ml-auto flex items-center gap-2"
                  >
                    <div class="flex -space-x-2 items-center">
                      <template
                        v-for="(u, idx) in (voiceUsers[channel.id] || []).slice(
                          0,
                          3
                        )"
                        :key="u.socketId || idx"
                      >
                        <img
                          :src="u.avatar"
                          :alt="u.username"
                          class="w-5 h-5 rounded-full ring-2 ring-dark-800 border border-black"
                          :title="u.username"
                        />
                      </template>
                    </div>
                    <div class="text-xs text-green-400 font-semibold">
                      {{ voicePresence[channel.id] }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- Fallback to navigation menu if needed -->
        <UNavigationMenu
          v-else
          orientation="vertical"
          :items="itemsChannel"
          @update:model-value=""
        />
      </div>
    </div>
  </div>
  <!-- Create Category Modal -->
  <CreateCategoryModal
    v-model:open="isCreateCategoryModalOpen"
    :guild-id="communityStore.currentCommunity?.id"
    @created="onCategoryCreated"
  />

  <!-- Create Channel Modal -->
  <CreateChannelModal
    v-model:open="isCreateChannelModalOpen"
    :guild-id="communityStore.currentCommunity?.id"
    :default-parent-id="selectedCategoryId"
    @created="onChannelCreated"
  />

  <!-- Invite Modal -->
  <InviteModal
    v-model:open="isInviteModalOpen"
    :guild-id="communityStore.currentCommunity?.id"
    :guild-username="communityStore.currentCommunity?.name"
  />

  <ModalEventCommunity v-model:isOpen="isOpenEvent" />

  <!-- Sidebar debug panel (toggle with ?voice_debug=1) -->
  <div
    v-if="showSidebarDebug"
    class="fixed left-4 bottom-4 w-96 max-h-64 overflow-y-auto bg-black/80 text-white text-sm p-3 rounded-md z-60"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="font-semibold">Sidebar Socket Debug</div>
      <div class="text-xs text-gray-300">
        events: {{ socketDebugEventsSidebar.length }}
      </div>
    </div>
    <div class="space-y-2">
      <div
        v-for="ev in socketDebugEventsSidebar"
        :key="ev.t"
        class="border-b border-white/5 pb-1"
      >
        <div class="text-xs text-gray-300">
          {{ new Date(ev.t).toLocaleTimeString() }}
        </div>
        <pre class="text-xs text-white break-words">{{
          JSON.stringify(ev.payload, null, 2)
        }}</pre>
      </div>
    </div>
  </div>
</template>
