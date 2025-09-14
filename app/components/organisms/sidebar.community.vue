<script setup lang="ts">
import { ref } from "vue";

import type {
  DropdownMenuItem,
  NavigationMenuItem,
  RadioGroupItem,
} from "@nuxt/ui";
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import { leaveRoom } from "~/stores/websocket/websocket.action";
import InviteModal from "~/components/molecules/invite.modal.vue";

const route = useRoute();
const communityStore = useCommunityStore();
const channelStore = useChannelStore();
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

// Invite modal state
const isInviteModalOpen = ref(false);

// Ref for the form
const channelForm = ref<HTMLFormElement>();

// Reactive server name
const serverName = ref(communityStore.currentCommunity?.name || "My Server");

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

          // Tìm community trong list hiện có
          const community = communityStore.communities.find(
            (c: any) => c.id == communityId
          );
          // Fetch từ API nếu không có trong list
          try {
            await communityStore.fetchCommunityById(communityId);
          } catch (error) {
            console.error("Error fetching community:", error);
            // Reset về default nếu không tìm thấy
            serverName.value = "My Server";
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
  }
});

const items = ref<DropdownMenuItem[][]>([
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
    },
    {
      label: "Cài đặt máy chủ",
      icon: "i-lucide-settings",
    },
    {
      label: "Tạo kênh",
      icon: "i-lucide-circle-plus",
      onSelect: () => {
        openCreateChannelModal();
      },
    },
    {
      label: "Tạo danh mục",
      icon: "i-lucide-folder-plus",
    },
    {
      label: "Tạo sự kiện",
      icon: "i-lucide-calendar-1",
    },
    {
      label: "Chủ đề đang hoạt động",
      icon: "i-lucide-message-circle",
    },
    {
      label: "Thư mục App",
      icon: "i-lucide-gamepad-2",
    },
  ],
  [
    {
      label: "Cài đặt thông báo",
      icon: "i-lucide-bell-ring",
    },
    {
      label: "Cài đặt bảo mật",
      icon: "i-lucide-shield-half",
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

const itemsChannel = computed<NavigationMenuItem[][]>(() => {
  if (!channelStore.channels || channelStore.channels.length === 0) {
    return [];
  }

  // Tạo items động từ channels
  const channelItems: NavigationMenuItem[] = channelStore.channels.map(
    (channel: any) => ({
      label: channel.name || "Kênh không tên",
      icon:
        channel.type === "GUILD_TEXT" ? "i-lucide-hash" : "i-lucide-volume-2", // Icon dựa trên type
      to: `/community/@${communityStore.currentCommunity?.name}-${communityStore.currentCommunity?.id}/${channel.id}`,
    })
  );

  return [channelItems];
});

onUnmounted(() => {
  if (guildId) {
    leaveRoom(`community_${guildId}`);
  }
});

// Thêm watch để fetch lại khi currentCommunity thay đổi
watch(
  () => communityStore.currentCommunity,
  async (newCommunity) => {
    if (newCommunity?.id) {
      await channelStore.fetchAllChannelsByGuildId(newCommunity.id);
    }
  }
);

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
  try {
    await channelStore.createChannel({
      name: newChannel.value.name,
      type: newChannel.value.type,
      guildId: communityStore.currentCommunity.id,
    });

    if (channelStore.channels && channelStore.channels.length > 0) {
      const lastChannel =
        channelStore.channels[channelStore.channels.length - 1];
      if (lastChannel?.id) {
        navigateTo(
          `/community/@${communityStore.currentCommunity?.name}-${communityStore.currentCommunity?.id}/${lastChannel.id}`
        );
      }
    }

    closeCreateChannelModal();
  } catch (error) {
    console.error("Error creating channel:", error);
    // Có thể thêm toast notification
  } finally {
    isCreating.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-800 text-white w-60 relative">
    <UDropdownMenu :items="items" :ui="{ content: 'w-48' }">
      <UButton color="neutral" variant="outline" class="justify-between w-full">
        <span>{{ serverName }}</span>
        <UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
      </UButton>
    </UDropdownMenu>

    <UNavigationMenu
      orientation="vertical"
      :items="itemsNavigates"
      :ui="{
        item: {
          base: 'flex items-center gap-2 px-3 py-2 rounded-md transition',
          active: 'bg-neutral-800 text-white',
          inactive: 'text-neutral-400 hover:bg-neutral-700 hover:text-white',
        },
      }"
      class="mt-4"
    />
    <USeparator class="my-2" />

    <UNavigationMenu
      orientation="vertical"
      :items="itemsChannel"
      :ui="{
        item: {
          base: 'flex items-center gap-2 px-3 py-2 rounded-md transition text-base',
          active: 'bg-neutral-800 text-white',
          inactive: 'text-neutral-400 hover:bg-neutral-700 hover:text-white',
        },
      }"
      class="mt-4"
    />
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
          >
            <template #item="{ item }">
              <div class="flex items-center gap-3">
                <component :is="item.icon" class="w-5 h-5 text-primary" />
                <div>
                  <div class="font-medium">{{ item.label }}</div>
                  <div class="text-sm text-gray-500">
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </template>
          </URadioGroup>
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
