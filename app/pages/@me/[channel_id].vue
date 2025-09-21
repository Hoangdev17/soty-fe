<script setup lang="ts">
import { useChannelStore } from "~/stores/channels/channel.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useInitializeForDM } from "~/composables/useInitializeForDM";

definePageMeta({
  layout: "main",
  middleware: ["required-auth"],
});

const route = useRoute();
const channelStore = useChannelStore();
const channelId = computed(() => route.params.channel_id as string);

// Fetch channel data before rendering
const { data: channelData } = await useAsyncData(
  `channel-${channelId.value}`,
  () => channelStore.fetchChannelDmById(channelId.value)
);

// Set currentChannel from fetched data
if (channelData.value) {
  channelStore.currentChannel = channelData.value;
}

const { currentChannel } = storeToRefs(useChannelStore());

useHead({
  title: `Soty | ${currentChannel?.value?.name || "Tin nhắn"}`,
  meta: [
    {
      name: "description",
      content: "Đăng nhập vào Soty để kết nối với bạn bè và cộng đồng.",
    },
  ],
});

onMounted(async () => {
  const { initializeForDM } = useInitializeForDM();
  await initializeForDM();

  // Channel is already fetched, no need to fetch again
});
</script>

<template>
  <div class="flex min-h-screen w-full bg-[var(--ui-bg)]">
    <!-- Sidebar trái -->
    <div class="flex flex-col sticky top-0 h-screen min-w-[210px] md:p-4 gap-4">
      <OrganismsSidebarDmMessage class="flex-1 w-full" />
    </div>

    <!-- Separator vertical -->
    <USeparator orientation="vertical" class="h-screen" />

    <!-- Main content -->
    <main class="flex-1 overflow-hidden">
      <OrganismsDmMessage v-if="currentChannel?.type === 'DM'" />
    </main>
  </div>
</template>
