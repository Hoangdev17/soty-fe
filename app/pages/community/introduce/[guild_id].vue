<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useCommunityStore } from "~/stores/community/community.store";

definePageMeta({
  layout: "main",
  middleware: [requiredAuth],
});

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();

const guildId = route.params.guild_id as string;
const { currentCommunity, isLoadingCurrentCommunity } =
  storeToRefs(communityStore);

// Fetch community data only if not already loaded
onMounted(async () => {
  if (guildId && !currentCommunity.value) {
    await communityStore.fetchCommunityById(guildId);
  }
});

// Join community
const joinCommunity = async () => {
  if (!currentCommunity.value) return;
  const guildUsername = currentCommunity.value.name;

  try {
    await communityStore.joinCommunity(guildId);

    // Cập nhật số member cục bộ
    currentCommunity.value.memberCount++;

    // Chỉ redirect khi join thành công
    navigateTo(`/community/@${guildUsername}-${guildId}`);
  } catch (error) {
    console.error("Failed to join community:", error);
    // Không redirect nếu thất bại
    // Có thể show toast/error message ở đây
  }
};

// Check if user is already a member
const isMember = computed(() => {
  // This would need to be implemented based on your auth/user store
  return false; // Placeholder
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
  <div class="min-h-screen bg-dark-900">
    <!-- Loading state -->
    <div
      v-if="isLoadingCurrentCommunity"
      class="flex justify-center items-center min-h-screen"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
      ></div>
    </div>

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
      <div
        v-if="currentCommunity.banner"
        class="w-full h-48 md:h-64 bg-cover bg-center rounded-lg mb-6"
        :style="{ backgroundImage: `url(${currentCommunity.banner})` }"
      ></div>

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
              <span>{{ currentCommunity.memberCount }} members</span>
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
            @click="
              $router.push(
                `/community/@${currentCommunity.owner?.username}-${guildId}`
              )
            "
            size="lg"
            color="gray"
            class="px-8 py-3"
          >
            <UIcon name="i-lucide-log-in" class="w-5 h-5 mr-2" />
            Enter Community
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
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
