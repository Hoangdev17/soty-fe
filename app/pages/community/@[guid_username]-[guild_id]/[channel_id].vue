<script setup lang="ts">
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useMessage } from "~/composables/useMessage";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { ChannelType } from "~/stores/channels/channel.type";
import ChannelLoading from "~/components/organisms/channel.loading.vue";
import TextChannel from "~/components/organisms/text.channel.vue";
import VoiceChannel from "~/components/organisms/voice.channel.vue";
import SeminarChannel from "~/components/organisms/seminar.channel.vue";
import DmChannel from "~/components/organisms/dm.channel.vue";

definePageMeta({
  layout: "community-layout",
});

const channelStore = useChannelStore();
const guildStore = useCommunityStore();
const memberStore = useMemberStore();

const { leaveRoom, fetchMessages, getMessages, fetchThreadsByChannel } =
  useMessage();

const route = useRoute();
const channelId = route.params.channel_id as string | undefined;
const guildId = route.params.guild_id as string | undefined;
const { currentChannel } = storeToRefs(channelStore);

const isPageLoading = ref(true);
const messageLoading = ref(false);
const isThread = ref(false);

// Flag để tránh multiple fetch community
const isFetchingCommunity = ref(false);

// Check if there are messages to conditionally show welcome
const hasMessages = computed(() => {
  if (!channelId) return false;
  return getMessages(channelId).length > 0;
});

onMounted(async () => {
  if (!guildId || !channelId) return;

  await guildStore.fetchCommunityById(guildId);
  const channel = await channelStore.fetchChannelById(guildId, channelId);

  if (
    channel?.type === ChannelType.GUILD_FORUM ||
    channel?.type === ChannelType.GUILD_PUBLIC_THREAD ||
    channel?.type === ChannelType.GUILD_PRIVATE_THREAD
  ) {
    isThread.value = true;
  }

  // Always fetch members for the current guild
  await memberStore.fetchMembersViaWebSocket(guildId);

  await fetchMessages(channelId);

  // Fetch threads for the channel
  await fetchThreadsByChannel(channelId);

  messageLoading.value = false;
  isPageLoading.value = false;
});

// Watch for route parameter changes to reset stores when switching communities/channels
watch(
  () => route.params.guild_id,
  async (newGuildId, oldGuildId) => {
    if (newGuildId && newGuildId !== oldGuildId) {
      // Tránh multiple fetch cùng lúc
      if (isFetchingCommunity.value) {
        console.log(`⏳ Channel Page: Already fetching community, skipping...`);
        return;
      }
      isFetchingCommunity.value = true;

      // Reset loading state
      isPageLoading.value = true;
      messageLoading.value = true;

      try {
        // Fetch new community data (this will also reset stores)
        await guildStore.fetchCommunityById(newGuildId as string);

        // Fetch members for new community
        await memberStore.fetchMembersViaWebSocket(newGuildId as string);
      } finally {
        // Reset flag sau khi fetch xong
        isFetchingCommunity.value = false;
        isPageLoading.value = false;
      }
    }
  }
); // Watch for route parameter changes to reset stores when switching communities/channels
watch(
  () => route.params.guild_id,
  async (newGuildId, oldGuildId) => {
    if (newGuildId && newGuildId !== oldGuildId) {
      // Reset loading state
      isPageLoading.value = true;
      messageLoading.value = true;

      // Fetch new community data (this will also reset stores)
      await guildStore.fetchCommunityById(newGuildId as string);

      // Fetch members for new community
      await memberStore.fetchMembersViaWebSocket(newGuildId as string);

      isPageLoading.value = false;
    }
  }
);

onUnmounted(() => {
  if (channelId) {
    leaveRoom(`channel_${channelId}`);
  }
  if (guildId) {
    leaveRoom(`community_${guildId}`);
  }
});

const isOpenSlideoverMember = ref(false);
</script>

<template>
  <ChannelLoading v-if="isPageLoading" />
  <DmChannel
    v-else-if="currentChannel?.type === ChannelType.DM"
    :channelId="channelId || ''"
    :currentChannel="currentChannel"
    :hasMessages="hasMessages"
    :messageLoading="messageLoading"
  />
  <TextChannel
    v-else-if="currentChannel?.type === ChannelType.GUILD_TEXT"
    :channelId="channelId || ''"
    :currentChannel="currentChannel"
    :hasMessages="hasMessages"
    :messageLoading="messageLoading"
    :isOpenSlideoverMember="isOpenSlideoverMember"
    @toggleMemberPanel="isOpenSlideoverMember = !isOpenSlideoverMember"
    @closeMemberPanel="isOpenSlideoverMember = false"
  />
  <VoiceChannel
    v-else-if="currentChannel?.type === ChannelType.GUILD_VOICE"
    :channelId="channelId || ''"
    :currentChannel="currentChannel"
    :isOpenSlideoverMember="isOpenSlideoverMember"
    @toggleMemberPanel="isOpenSlideoverMember = !isOpenSlideoverMember"
    @closeMemberPanel="isOpenSlideoverMember = false"
  />
  <SeminarChannel
    v-else-if="currentChannel?.type === ChannelType.SEMINAR"
    :channelId="channelId || ''"
    :currentChannel="currentChannel"
    :isOpenSlideoverMember="isOpenSlideoverMember"
    @toggleMemberPanel="isOpenSlideoverMember = !isOpenSlideoverMember"
    @closeMemberPanel="isOpenSlideoverMember = false"
  />
  <OrganismsThreadChannel
    v-else-if="isThread"
    :threadId="channelId"
    @toggleMemberPanel="isOpenSlideoverMember = !isOpenSlideoverMember"
    @closeMemberPanel="isOpenSlideoverMember = false"
  />
</template>
