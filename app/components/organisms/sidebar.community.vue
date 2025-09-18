<script setup lang="ts">
import type {
  DropdownMenuItem,
  NavigationMenuItem,
  RadioGroupItem,
} from "@nuxt/ui";
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useMessage } from "~/composables/useMessage";
import { leaveRoom } from "~/stores/websocket/websocket.action";
import InviteModal from "~/components/molecules/invite.modal.vue";

const route = useRoute();
const communityStore = useCommunityStore();
const channelStore = useChannelStore();
const { fetchThreadsByChannel } = useMessage();

// Function to fetch threads for all channels
const fetchAllThreads = async () => {
  if (channelStore.channels && channelStore.channels.length > 0) {
    for (const channel of channelStore.channels) {
      if (channel.type === "GUILD_TEXT" || channel.type === "GUILD_NEWS") {
        await fetchThreadsByChannel(channel.id);
      }
    }
  }
};
const guildId = ref(route.params.guild_id as string | undefined);
const itemsNavigates = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Sự kiện",
      icon: "i-lucide-users",
      to: "/@me/channels",
    },
    {
      label: "Nâng cấp máy chủ",
      icon: "i-lucide-store",
      to: "/community",
    },
    {
      label: "Giới thiệu về community",
      icon: "i-lucide-store",
      to: "/community/introduce/" + (guildId.value || ""),
    },
  ],
]);
watch(
  () => route.params.guild_id,
  (newGuildId) => {
    guildId.value = newGuildId as string | undefined;

    // Cập nhật itemsNavigates để to được tính toán lại
    itemsNavigates.value = [
      [
        {
          label: "Sự kiện",
          icon: "i-lucide-users",
          to: "/@me/channels",
        },
        {
          label: "Nâng cấp máy chủ",
          icon: "i-lucide-store",
          to: "/community",
        },
        {
          label: "Giới thiệu về community",
          icon: "i-lucide-store",
          to: "/community/introduce/" + (guildId.value || ""),
        },
      ],
    ];
  },
  { immediate: true }
);

const isCreating = ref(false);
const isCreatingChannel = ref(false); // Track if this client is creating a channel
const creatingChannelName = ref(""); // Track the name of the channel being created

// Watch for new channels being added to navigate only for creator
watch(
  () => channelStore.channels?.length,
  async (newLength, oldLength) => {
    if (newLength !== oldLength) {
      // Refetch threads when channels change
      await fetchAllThreads();
    }

    if (
      newLength > oldLength &&
      isCreatingChannel.value &&
      creatingChannelName.value
    ) {
      // Find the newly created channel
      const newestChannel = channelStore.channels?.find(
        (channel) => channel.name === creatingChannelName.value
      );

      if (newestChannel && communityStore.currentCommunity) {
        // Set as current channel and navigate
        channelStore.currentChannel = newestChannel;

        const newUrl = `/community/@${communityStore.currentCommunity.name}-${communityStore.currentCommunity.id}/${newestChannel.id}`;

        // Navigate to the new channel
        navigateTo(newUrl);

        // Reset flags
        isCreatingChannel.value = false;
        creatingChannelName.value = "";
      }
    }
  }
);

// Invite modal state
const isInviteModalOpen = ref(false);

// Ref for the form
const channelForm = ref<HTMLFormElement>();

// Reactive server name
const serverName = ref(communityStore.currentCommunity?.name || "My Server");

// Dropdown state
const showDropdown = ref(false);

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

// Watch route changes to update currentCommunity
watch(
  () => route.path,
  async (newPath) => {
    if (newPath.startsWith("/community/")) {
      // Extract community ID từ URL
      const pathParts = newPath.split("/");
      const communitySlug = pathParts[pathParts.length - 1];

      if (communitySlug) {
        // Handle both formats: @name-id or name-id
        let cleanSlug = communitySlug;
        if (cleanSlug.startsWith("@")) {
          cleanSlug = cleanSlug.substring(1);
        }

        const lastDashIndex = cleanSlug.lastIndexOf("-");
        if (lastDashIndex !== -1) {
          const communityId = cleanSlug.substring(lastDashIndex + 1);

          // Validate that communityId is a valid format (should be numeric or UUID-like)
          if (
            communityId &&
            (communityId.match(/^\d+$/) || communityId.match(/^[a-f0-9-]+$/i))
          ) {
            // Tìm community trong list hiện có
            const community = communityStore.communities.find(
              (c: any) => c.id == communityId
            );

            if (community) {
              // Use existing community
              communityStore.currentCommunity = community;
            } else {
              // Fetch từ API nếu không có trong list
              try {
                await communityStore.fetchCommunityById(communityId);
              } catch (error) {
                console.error("Error fetching community:", error);
                // Reset về default nếu không tìm thấy
                communityStore.currentCommunity = null;
                serverName.value = "My Server";
              }
            }
          }
        }
      }
    } else if (newPath === "/@me/channels") {
      // Reset khi về home
      communityStore.currentCommunity = null;
      serverName.value = "My Server";
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (communityStore?.currentCommunity?.id) {
    await channelStore.fetchAllChannelsByGuildId(
      communityStore.currentCommunity.id
    );
    await fetchAllThreads();
  }
  // Close dropdown when clicking outside (event listener attached in setup)
  if (communityStore?.currentCommunity?.id) {
    // noop - setup complete
  }
});

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
        isInviteModalOpen.value = true;
      },
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Cài đặt máy chủ",
      icon: "i-lucide-settings",
      to: communityStore.currentCommunity
        ? `/community/@${communityStore.currentCommunity.name}-${communityStore.currentCommunity.id}/settings`
        : undefined,
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Tạo kênh",
      icon: "i-lucide-circle-plus",
      onSelect: () => {
        openCreateChannelModal();
      },
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Tạo danh mục",
      icon: "i-lucide-folder-plus",
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Tạo sự kiện",
      icon: "i-lucide-calendar-1",
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Chủ đề đang hoạt động",
      icon: "i-lucide-message-circle",
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Thư mục App",
      icon: "i-lucide-gamepad-2",
      disabled: !communityStore.currentCommunity,
    },
  ],
  [
    {
      label: "Cài đặt thông báo",
      icon: "i-lucide-bell-ring",
      disabled: !communityStore.currentCommunity,
    },
    {
      label: "Cài đặt bảo mật",
      icon: "i-lucide-shield-half",
      disabled: !communityStore.currentCommunity,
    },
  ],
]);

const itemChannelType = ref<RadioGroupItem[]>([
  {
    label: "TEXT",
    icon: "i-lucide-hash",
    value: "GUILD_TEXT",
    description: "Tailored for indie hackers, freelancers and solo founders.",
  },
  {
    label: "Voice",
    icon: "i-lucide-volume-2",
    value: "GUILD_VOICE",
    description: "Perfect for teams of 2-10 people.",
  },
]);

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
  if (!channelStore.channels || channelStore.channels.length === 0) {
    return [];
  }

  // Tạo items động từ channels và threads
  const channelItems: NavigationMenuItem[] = [];

  channelStore.channels.forEach((channel: any) => {
    // Add the main channel
    channelItems.push({
      label: channel.name || "Kênh không tên",
      icon: getChannelIcon(channel.type),
      to: `/community/@${communityStore.currentCommunity?.name}-${communityStore.currentCommunity?.id}/${channel.id}`,
    });

    // Add threads for this channel as children
  });

  return [channelItems];
});

onUnmounted(() => {
  if (guildId.value) {
    leaveRoom(`community_${guildId.value}`);
  }
});

const isCreateChannelModalOpen = ref(false);

// Reactive data cho form
const newChannel = ref({
  name: "",
  type: "GUILD_TEXT", // Mặc định là text
});

// Hàm mở modal
const openCreateChannelModal = () => {
  isCreateChannelModalOpen.value = true;
};

// Hàm đóng modal
const closeCreateChannelModal = () => {
  isCreateChannelModalOpen.value = false;
  newChannel.value = { name: "", type: "GUILD_TEXT" };
};

// Hàm tạo kênh
const createChannel = async () => {
  if (!newChannel.value.name.trim() || !communityStore.currentCommunity?.id)
    return;

  isCreating.value = true;
  isCreatingChannel.value = true; // Set flag that this client is creating
  creatingChannelName.value = newChannel.value.name; // Store the channel name

  try {
    await channelStore.createChannel({
      name: newChannel.value.name,
      type: newChannel.value.type,
      guildId: communityStore.currentCommunity.id,
    });

    // Close modal immediately, let watcher handle navigation
    closeCreateChannelModal();

    // Set timeout to reset flags if no response after 10 seconds
    setTimeout(() => {
      if (isCreatingChannel.value) {
        isCreatingChannel.value = false;
        creatingChannelName.value = "";
      }
    }, 10000);
  } catch (error) {
    console.error("Error creating channel:", error);
    // Reset flags on error
    isCreatingChannel.value = false;
    creatingChannelName.value = "";
  } finally {
    isCreating.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-800 text-white w-60 relative">
    <!-- Header section with Discord-style colors -->
    <div class="flex-shrink-0 px-4 pt-4 pb-2">
      <!-- Server Header -->
      <div class="relative">
        <header
          class="flex items-center justify-between text-gray-200 rounded-md transition-colors cursor-pointer hover:bg-gray-600/30 px-2 py-1"
          @click.stop="showDropdown = !showDropdown"
        >
          <span class="font-medium text-base truncate">{{ serverName }}</span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-gray-400 transition-transform"
            :class="{ 'rotate-180': showDropdown }"
          />
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
        <UNavigationMenu orientation="vertical" :items="itemsChannel" />
      </div>
    </div>
  </div>
  <!-- Modal tạo kênh -->
  <UModal v-model:open="isCreateChannelModalOpen" class="max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-hash" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Tạo kênh mới</h3>
      </div>
    </template>
    <template #body>
      <form ref="channelForm" @submit.prevent="createChannel" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Tên kênh</label>
          <UInput
            v-model="newChannel.name"
            placeholder="Ví dụ: general"
            required
            :disabled="isCreating"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Loại kênh</label>
          <URadioGroup
            v-model="newChannel.type"
            color="primary"
            variant="card"
            :items="itemChannelType"
            :disabled="isCreating"
          />
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          color="neutral"
          @click="closeCreateChannelModal"
          :disabled="isCreating"
        >
          Hủy
        </UButton>
        <UButton
          color="primary"
          @click="channelForm?.requestSubmit()"
          :loading="isCreating"
          :disabled="!newChannel.name.trim()"
        >
          Tạo kênh
        </UButton>
      </div>
    </template>
  </UModal>
  <!-- Invite Modal -->
  <InviteModal
    v-model:open="isInviteModalOpen"
    :guild-id="communityStore.currentCommunity?.id"
    :guild-username="communityStore.currentCommunity?.name"
  />
</template>
