<script setup lang="ts">
import CommunityRoleSettings from "~/components/organisms/community.role.settings.vue";
import { useCommunityStore } from "~/stores/community/community.store";
import MobileCommunitySettingsWrapper from "~/components/organisms/mobile.community.settings.wrapper.vue";
import { useBreakpoint } from "~/composables/useBreakpoint.client";

const { isMobile } = useBreakpoint();
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
  <MobileCommunitySettingsWrapper current-section="roles" title="Roles">
    <!-- Mobile Content -->
    <template #default>
      <!-- Mobile Header with Create Role Button -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold text-white">Manage Roles</h2>
          <p class="text-gray-400 text-sm mt-1">
            Control permissions for your community
          </p>
        </div>
        <UButton
          @click="createNewRole"
          color="primary"
          icon="i-lucide-plus"
          size="sm"
          class="text-xs px-3 py-1"
        >
          Create
        </UButton>
      </div>

      <CommunityRoleSettings :guild-id="guildId" />
    </template>

    <!-- Desktop Content -->
    <template #desktop>
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
    </template>
  </MobileCommunitySettingsWrapper>
</template>
