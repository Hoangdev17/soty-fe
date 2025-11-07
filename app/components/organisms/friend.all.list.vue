<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import { ChannelType } from "~/stores/channels/channel.type";

const authStore = useAuthStore();
const channelStore = useChannelStore();
const { friends } = storeToRefs(authStore);
const { getUserDisplayName } = useDisplayName();

onMounted(() => {
  authStore.getUserFriendList();
});

async function handleDeleteUser(userId: string) {
  await authStore.deleteFriend(userId);
}

function getMenuItems(friendId: string): DropdownMenuItem[][] {
  return [
    [
      {
        label: "Xem hồ sơ",
        icon: "i-lucide-user",
      },
    ],
    [
      {
        label: "Xóa bạn bè",
        icon: "i-lucide-x",
        color: "error",
        onSelect: () => handleDeleteUser(friendId),
      },
    ],
  ];
}

async function handleGoToDmMessage(id: string) {
  try {
    const channel = channelStore.channelDM.find(
      (c) => c.type === ChannelType.DM && c.recipients?.some((a) => a.id === id)
    );

    navigateTo(`/@me/${channel?.id}`);
  } catch (error) {
    const channelDM = await channelStore.createChannelDm([id]);
    navigateTo(`/@me/${channelDM.id}`);
  }
}
</script>

<template>
  <UInput placeholder="Search..." class="w-full" icon="i-lucide-search" />
  <p class="text-sm mt-2">Tất cả bạn bè - {{ friends?.length || 0 }}</p>

  <div v-if="friends?.length" class="mt-2">
    <div
      v-for="friend in friends"
      :key="friend.id"
      class="w-full flex justify-between items-center py-3 px-2 transition-colors duration-200 hover:bg-gray-800/40 mt-2 border-t border-gray-700"
    >
      <div class="flex items-center">
        <UAvatar
          :src="friend.avatar || ''"
          class="mt-1"
          size="lg"
          :alt="friend.username"
        />
        <div class="flex flex-col ml-3">
          <span class="text-md font-medium">{{
            getUserDisplayName(friend)
          }}</span>
          <span v-if="friend.presence?.status === `ONLINE`">
            <UBadge variant="soft">Online</UBadge>
          </span>
          <span v-else>
            <UBadge color="neutral" variant="soft">Offline</UBadge>
          </span>
        </div>
      </div>

      <div class="flex gap-4 items-center">
        <UButton
          color="neutral"
          variant="ghost"
          @click="handleGoToDmMessage(friend.id)"
        >
          <UIcon name="i-lucide-message-circle" class="size-5 cursor-pointer"
        /></UButton>

        <UDropdownMenu
          :items="getMenuItems(friend.id)"
          :ui="{ content: 'w-48' }"
          mode="click"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>

  <div
    v-else
    class="mt-6 flex flex-col items-center justify-center text-gray-500 py-10"
  >
    <UIcon name="i-lucide-users" class="size-8 mb-3 text-gray-500" />
    <p class="text-sm text-center">
      Bạn chưa có người bạn nào.<br />
      Hãy gửi lời mời kết bạn để bắt đầu trò chuyện!
    </p>
  </div>
</template>
