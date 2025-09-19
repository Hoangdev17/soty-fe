<script setup lang="ts">
import CommunityRoleSettings from "~/components/organisms/community.role.settings.vue";
import { useCommunityStore } from "~/stores/community/community.store";
const route = useRoute();
const router = useRouter();
const guildId = route.params.guild_id as string;
const guildUsername = route.params.guid_username as string;

definePageMeta({
  middleware: ["required-auth"],
});

useHead({
  title: `Soty | #Settings | Roles`,
  meta: [
    {
      name: "description",
      content: "Đăng nhập vào Soty để kết nối với bạn bè và cộng đồng.",
    },
  ],
});

const createNewRole = () => {
  router.push(`/community/@${guildUsername}-${guildId}/roles/create`);
};
const communityStore = useCommunityStore();
onMounted(() => {
  if (!communityStore.currentCommunity) {
    communityStore.fetchCommunityById(guildId);
  }
});
</script>

<template>
  <div class="flex items-start size-full bg-dark-900">
    <!-- Sidebar setting -->
    <OrganismsSidebarSettingCommunity />

    <!-- Main Content -->
    <div
      class="w-full max-w-4xl mx-auto p-6 overflow-y-auto overflow-x-hidden relative bg-dark-900"
    >
      <!-- Header with Create Role Button -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Roles</h2>
          <p class="text-gray-400 mt-1">
            Manage roles and permissions for your community
          </p>
        </div>
        <UButton
          @click="createNewRole"
          color="primary"
          icon="i-lucide-plus"
          size="lg"
        >
          Create Role
        </UButton>
      </div>

      <CommunityRoleSettings :guild-id="guildId" />
    </div>
  </div>
</template>
