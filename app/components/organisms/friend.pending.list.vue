<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

const authStore = useAuthStore();
const { friendRequestSent } = storeToRefs(authStore);
const { getUserDisplayName } = useDisplayName();

onMounted(() => {
  authStore.getUserFriendRequestListSent();
});

async function handleRemoveFriendRequest(requestId: string) {
  await authStore.removeFriendRequest(requestId);
}
</script>

<template>
  <UInput placeholder="Search..." class="w-full" icon="i-lucide-search" />

  <p class="text-sm mt-2">
    Yêu cầu kết bạn đang chờ - {{ friendRequestSent?.length || 0 }}
  </p>

  <div v-if="friendRequestSent?.length" class="mt-2">
    <div
      v-for="friend in friendRequestSent"
      :key="friend.id"
      class="w-full flex justify-between items-center py-3 px-2 transition-colors duration-200 hover:bg-gray-800/40 mt-2 border-t border-gray-700"
    >
      <div class="flex items-center">
        <UAvatar
          :src="friend.receiver.avatar || ''"
          :alt="getUserDisplayName(friend.receiver)"
          class="mt-1"
          size="lg"
        />
        <div class="flex flex-col ml-3">
          <span class="text-md font-medium">{{
            getUserDisplayName(friend.receiver)
          }}</span>
          <span class="text-sm text-gray-500">Offline</span>
        </div>
      </div>

      <div class="flex gap-3 text-gray-400 items-center">
        <UBadge
          v-if="friend.status === 'PENDING'"
          label="Đang chờ"
          color="warning"
          variant="subtle"
        />
        <UBadge
          v-else-if="friend.status === 'ACCEPTED'"
          label="Đã chấp nhận"
          color="success"
          variant="subtle"
        />
        <UBadge
          v-else-if="friend.status === 'REJECTED'"
          label="Đã từ chối"
          color="error"
          variant="subtle"
        />

        <UButton
          color="error"
          variant="ghost"
          @click="handleRemoveFriendRequest(friend.id)"
          icon="i-lucide-x"
          size="xs"
        />
      </div>
    </div>
  </div>

  <div
    v-else
    class="mt-6 flex flex-col items-center justify-center text-gray-500 py-10"
  >
    <UIcon name="i-lucide-user-plus" class="size-8 mb-3 text-gray-500" />
    <p class="text-sm text-center">
      Bạn chưa gửi lời mời kết bạn nào.<br />
      Hãy tìm và gửi lời mời kết bạn để bắt đầu kết nối!
    </p>
  </div>
</template>
