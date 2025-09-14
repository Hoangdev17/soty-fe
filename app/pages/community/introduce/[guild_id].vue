<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useCommunityStore } from "~/stores/community/community.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useMemberStore } from "~/stores/member/member.store";
import { leaveRoom } from "~/stores/websocket/websocket.action";
import CommunityLoading from "~/components/organisms/CommunityLoading.vue";
import CommunityBanner from "~/components/organisms/community.banner.vue";
import InviteModal from "~/components/molecules/invite.modal.vue";

definePageMeta({
  layout: "community-layout",
  middleware: [requiredAuth],
});

const route = useRoute();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const memberStore = useMemberStore();

const guildId = route.params.guild_id as string;
const { currentCommunity, isLoadingCurrentCommunity } =
  storeToRefs(communityStore);

// Local loading state
const isPageLoading = ref(true);
const isJoinLoading = ref(false);
const isInviteModalOpen = ref(false);

// Flag để tránh multiple fetch community
const isFetchingCommunity = ref(false);

// Fetch community data only if not already loaded
onMounted(async () => {
  if (guildId) {
    await communityStore.fetchCommunityById(guildId);

    // Fetch members
    await memberStore.fetchMembersViaWebSocket(guildId);
  }
  isPageLoading.value = false;
});

// Watch for guildId changes to reset stores when switching communities
watch(
  () => route.params.guild_id,
  async (newGuildId, oldGuildId) => {
    if (newGuildId && newGuildId !== oldGuildId) {
      // Tránh multiple fetch cùng lúc
      if (isFetchingCommunity.value) {
        console.log(
          `⏳ Introduce Page: Already fetching community, skipping...`
        );
        return;
      }

      // Set flag để tránh multiple fetch
      isFetchingCommunity.value = true;

      // Reset loading state
      isPageLoading.value = true;

      try {
        // Fetch new community data (this will also reset stores)
        await communityStore.fetchCommunityById(newGuildId as string);

        // Fetch members for new community
        await memberStore.fetchMembersViaWebSocket(newGuildId as string);
      } finally {
        // Reset flag sau khi fetch xong
        isFetchingCommunity.value = false;
        isPageLoading.value = false;
      }
    }
  }
);

onUnmounted(() => {
  if (guildId) {
    leaveRoom(`community_${guildId}`);
  }
});

// Join community
const joinCommunity = async () => {
  if (!currentCommunity.value) return;

  try {
    isJoinLoading.value = true;
    await communityStore.joinCommunity(guildId);

    // Member count will be updated via memberStore
    isJoinLoading.value = true;
  } catch (error) {
    console.error("Failed to join community:", error);
    // Không redirect nếu thất bại
    // Có thể show toast/error message ở đây
  }
};

// Check if user is already a member
const isMember = computed(() => {
  if (!authStore.user || !guildId) return false;
  const members = memberStore.getMembersByGuild(guildId);
  return members.some((member) => member.userId === authStore.user!.id);
});

// Helper function for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<template>
  <div class="h-screen bg-dark-900 overflow-hidden">
    <!-- Loading state -->
    <CommunityLoading v-if="isPageLoading" />

    <!-- Community not found -->
    <div
      v-else-if="!currentCommunity"
      class="flex justify-center items-center min-h-screen"
    >
      <div class="text-center">
        <h1 class="text-2xl font-bold text-white mb-4">Community Not Found</h1>
        <p class="text-gray-400 mb-6">
          The community you're looking for doesn't exist or has been deleted.
        </p>
        <UButton @click="$router.push('/community/discover')" color="primary">
          Browse Communities
        </UButton>
      </div>
    </div>

    <!-- Community content -->
    <div v-else class="max-w-4xl mx-auto px-4 py-8">
      <!-- Banner -->
      <CommunityBanner
        :banner="currentCommunity.banner"
        :name="currentCommunity.name"
        class="mb-6"
      />

      <!-- Community Header -->
      <div
        class="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8"
      >
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <UAvatar
            :src="currentCommunity.avatar"
            :alt="currentCommunity.name"
            size="xl"
            class="w-24 h-24 md:w-32 md:h-32"
          />
        </div>

        <!-- Community Info -->
        <div class="flex-1">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
            {{ currentCommunity.name }}
          </h1>
          <p class="text-gray-300 text-lg mb-4">
            {{ currentCommunity.description }}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-6 text-sm text-gray-400">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-4 h-4" />
              <span>{{ memberStore.getMemberCount(guildId) }} members</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="w-4 h-4" />
              <span>Created {{ formatDate(currentCommunity.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Join Button -->
        <div class="flex-shrink-0">
          <UButton
            v-if="!isMember"
            @click="joinCommunity"
            size="lg"
            color="primary"
            class="px-8 py-3"
          >
            <UIcon name="i-lucide-user-plus" class="w-5 h-5 mr-2" />
            Join Community
          </UButton>
          <UButton
            v-else
            @click="isInviteModalOpen = true"
            size="lg"
            color="primary"
            :loading="isJoinLoading"
            variant="outline"
            class="px-8 py-3"
          >
            <UIcon name="i-lucide-plus" class="w-5 h-5 mr-2" />
            Invite friend
          </UButton>
        </div>
      </div>

      <!-- Community Details -->
      <div class="grid md:grid-cols-2 gap-8">
        <!-- About Section -->
        <div class="bg-dark-800 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">About</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-1">Owner</h3>
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="currentCommunity.owner?.avatar"
                  :alt="currentCommunity.owner?.username"
                  size="sm"
                />
                <span class="text-white">{{
                  currentCommunity.owner?.username
                }}</span>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-1">Visibility</h3>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="
                  currentCommunity.visibility === 'PUBLIC'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                "
              >
                {{ currentCommunity.visibility }}
              </span>
            </div>

            <div v-if="currentCommunity.maximumMembers">
              <h3 class="text-sm font-medium text-gray-400 mb-1">
                Member Limit
              </h3>
              <span class="text-white">{{
                currentCommunity.maximumMembers
              }}</span>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="bg-dark-800 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Preview</h2>
          <div class="text-gray-300">
            <p class="mb-4">
              This is a preview of the community. Join to access all channels
              and features.
            </p>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-hash" class="w-4 h-4 text-gray-500" />
                <span>general</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-hash" class="w-4 h-4 text-gray-500" />
                <span>random</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-hash" class="w-4 h-4 text-gray-500" />
                <span>announcements</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <InviteModal
      v-model:open="isInviteModalOpen"
      :guild-id="guildId"
      :guild-username="currentCommunity?.name"
    />
  </div>
</template>
