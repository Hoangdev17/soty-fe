<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

const authStore = useAuthStore();
const { friendRequest } = storeToRefs(useAuthStore());
const { getUserDisplayName } = useDisplayName();
async function fetchFriendList() {
  await authStore.getUserFriendRequestList();
}
onMounted(() => {
  fetchFriendList();
});

async function handleAcceptRequest(requestId: string) {
  await authStore.acceptFriendRequest(requestId);
}

async function handleRejectRequest(requestId: string) {
  await authStore.rejectFriendRequest(requestId);
}
</script>

<template>
  <UInput placeholder="Search..." class="w-full" icon="i-lucide-search" />
  <p class="text-sm mt-2">
    Yêu cầu kết bạn đang chờ - {{ friendRequest?.length }}
  </p>

  <div v-if="friendRequest?.length" class="mt-2">
    <div
      v-for="(friend, index) in friendRequest"
      :key="friend.id"
      class="w-full flex justify-between items-center py-3 px-2 transition-colors duration-200 hover:bg-gray-800/40 mt-2 border-t border-gray-700"
    >
      <div class="flex items-center">
        <UAvatar
          :src="friend.sender.avatar || ''"
          :alt="getUserDisplayName(friend.sender)"
          class="mt-1"
          size="lg"
        />
        <div class="flex flex-col ml-3">
          <span class="text-md font-medium">{{
            getUserDisplayName(friend.sender)
          }}</span>
          <span class="text-sm text-gray-500">Offline</span>
        </div>
      </div>

      <div class="flex gap-3 text-gray-400">
        <UButton
          color="success"
          variant="ghost"
          @click="handleAcceptRequest(friend.id)"
        >
          <UIcon
            name="i-lucide-check"
            class="size-5 hover:text-green-500 cursor-pointer transition-colors"
          />
        </UButton>

        <UButton
          color="error"
          variant="ghost"
          @click="handleRejectRequest(friend.id)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-5 hover:text-red-500 cursor-pointer transition-colors"
          />
        </UButton>
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
