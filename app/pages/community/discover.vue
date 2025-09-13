<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useCommunityStore } from "~/stores/community/community.store";

definePageMeta({
  layout: "main",
  middleware: [requiredAuth],
});

const communityStore = useCommunityStore();
const { communitiesAll, isLoadingCommunities } = storeToRefs(communityStore);

// Loading state for navigation
const isNavigating = ref(false);

// Fetch communities on mount
onMounted(async () => {
  await communityStore.fetchAllCommunity();
});

// Search functionality
const searchQuery = ref("");
const filteredCommunities = computed(() => {
  if (!searchQuery.value) return communitiesAll.value;
  return communitiesAll.value.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      community.description
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase())
  );
});

// Navigate to introduce page with fresh data
const navigateToIntroduce = async (communityId: string) => {
  if (isNavigating.value) return; // Prevent multiple clicks

  try {
    isNavigating.value = true;

    // Clear current community data first
    communityStore.currentCommunity = null;

    // Fetch fresh data for the community
    await communityStore.fetchCommunityById(communityId);

    // Navigate to introduce page after data is loaded
    await navigateTo(`/community/introduce/${communityId}`);
  } catch (error) {
    console.error("Failed to load community data:", error);
    // You might want to show a toast notification here
  } finally {
    isNavigating.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-dark-900">
    <!-- Navigation Loading Overlay -->
    <div
      v-if="isNavigating"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-dark-800 rounded-lg p-6 flex items-center gap-4">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        ></div>
        <span class="text-white">Loading community...</span>
      </div>
    </div>
    <div class="flex">
      <div
        class="flex flex-col sticky top-0 h-screen min-w-[210px] md:p-4 gap-4"
      >
        <OrganismsSidebarDmMessage class="flex-1 w-full" />
      </div>

      <div class="flex-1 px-6 py-8 max-w-none">
        <div class="flex justify-between items-center mb-8">
          <!-- Header -->
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              Discover Communities
            </h1>
            <p class="text-gray-400 text-base">
              Find and join communities that interest you
            </p>
          </div>

          <!-- Search -->
          <div>
            <UInput
              v-model="searchQuery"
              placeholder="Search communities..."
              size="lg"
              class="max-w-md"
            >
              <template #leading>
                <UIcon name="i-lucide-search" class="w-5 h-5 text-gray-400" />
              </template>
            </UInput>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="isLoadingCommunities"
          class="flex justify-center items-center py-12"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
          ></div>
        </div>

        <!-- Communities Grid -->
        <div
          v-else-if="filteredCommunities.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <div
            v-for="community in filteredCommunities"
            :key="community.id"
            class="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors duration-200 cursor-pointer"
            :class="{ 'opacity-50 pointer-events-none': isNavigating }"
            @click="navigateToIntroduce(community.id)"
          >
            <!-- Banner -->
            <div
              v-if="community.banner"
              class="w-full h-28 bg-cover bg-center"
              :style="{ backgroundImage: `url(${community.banner})` }"
            ></div>
            <div
              v-else
              class="w-full h-28 bg-gradient-to-br from-blue-500 to-purple-600"
            ></div>

            <!-- Content -->
            <div class="p-5">
              <!-- Avatar and Name -->
              <div class="flex items-center gap-3 mb-3">
                <UAvatar
                  :src="community.avatar"
                  :alt="community.name"
                  size="md"
                />
                <div>
                  <h3 class="text-base font-semibold text-white">
                    {{ community.name }}
                  </h3>
                  <p class="text-sm text-gray-400">
                    by {{ community.owner?.username }}
                  </p>
                </div>
              </div>

              <!-- Description -->
              <p class="text-gray-300 text-sm mb-4 line-clamp-2">
                {{ community.description }}
              </p>

              <!-- Stats -->
              <div
                class="flex items-center justify-between text-sm text-gray-400"
              >
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-users" class="w-4 h-4" />
                    <span>{{ community.memberCount }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    <span>{{ community.visibility.toLowerCase() }}</span>
                  </div>
                </div>
                <UButton
                  size="sm"
                  color="primary"
                  variant="outline"
                  :disabled="isNavigating"
                  @click.stop="navigateToIntroduce(community.id)"
                >
                  View
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- No communities found -->
        <div v-else class="text-center py-12">
          <UIcon
            name="i-lucide-search"
            class="w-16 h-16 text-gray-600 mx-auto mb-4"
          />
          <h3 class="text-xl font-semibold text-white mb-2">
            No communities found
          </h3>
          <p class="text-gray-400">
            {{
              searchQuery
                ? "Try adjusting your search terms"
                : "No communities available at the moment"
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
