<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useCommunityStore } from "~/stores/community/community.store";
const communityStore = useCommunityStore();
const { fetchCommunityById } = useCommunityStore();
definePageMeta({
  layout: "community-layout",
  middleware: [requiredAuth],
});

// const route = useRoute();

// const guildId = route.params.guild_id as string;

// onMounted(async () => {
//   await fetchCommunityById(guildId);
// });
</script>

<template>
  <slot />
</template>
