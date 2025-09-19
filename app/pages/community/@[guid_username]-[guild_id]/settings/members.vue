<script setup lang="ts">
import { useRoute } from "vue-router";
import CommunityMemberManagement from "~/components/organisms/community.member.management.vue";
import { useCommunityStore } from "~/stores/community/community.store";

const route = useRoute();
const guildId = ref(route.params.guild_id as string | undefined);
const communityStore = useCommunityStore();

// Fetch community data before rendering
const { data: communityData } = await useAsyncData(
  `community-${guildId.value}`,
  () => communityStore.fetchCommunityById(guildId.value || "")
);

// Set currentCommunity from fetched data
if (communityData.value) {
  communityStore.currentCommunity = communityData.value;
}

const currentCommunity = computed(() => communityStore.currentCommunity);

useHead({
  title: `Soty | ${currentCommunity?.value?.name} | Members`,
  meta: [
    {
      name: "description",
      content: "Quản lý thành viên trong cộng đồng của bạn.",
    },
  ],
});
</script>

<template>
  <div class="flex items-start size-full bg-dark-900">
    <!-- Sidebar -->
    <OrganismsSidebarSettingCommunity />

    <!-- Main Content -->
    <div
      class="w-full max-w-4xl mx-auto p-6 overflow-y-auto overflow-x-hidden relative bg-dark-900"
    >
      <CommunityMemberManagement :guild-id="guildId!" />
    </div>
  </div>
</template>
