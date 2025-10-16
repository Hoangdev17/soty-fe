<script setup lang="ts">
import { useRoute } from "vue-router";
import { useCommunityStore } from "~/stores/community/community.store";
import CreateGuildForm from "../molecules/create.guild.form.vue";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useUnreadManager } from "~/composables/useUnreadManager";
import ThemeToggle from "../atoms/theme.toggle.vue";
const toast = useToast();

const route = useRoute();
const communityStore = useCommunityStore();
const wsStore = useWebSocketStore();
const isOpen = ref(false);
// Sử dụng userCommunity từ store
const userCommunity = computed(() => communityStore.communities);

// Khởi tạo communities khi component mount
onMounted(async () => {
  if (communityStore.communities.length === 0) {
    await communityStore.fetchCommunities();
  }
});

watch(
  () => route.path,
  async (newPath) => {
    // Kiểm tra nếu path là community route
    if (newPath.startsWith("/community/")) {
      // Format: /community/@name-id hoặc /community/name-id
      const pathParts = newPath.split("/");
      const communitySlug = pathParts[pathParts.length - 1];

      if (communitySlug) {
        // Tách name và ID từ slug
        const lastDashIndex = communitySlug.lastIndexOf("-");
        if (lastDashIndex !== -1) {
          const communityId = communitySlug.substring(lastDashIndex + 1);

          try {
            await communityStore.fetchCommunityById(communityId);
          } catch (error) {
          } finally {
            // Reset flag sau khi fetch xong
          }
        }
      }
    } else {
      communityStore.currentCommunity = null;
    }
  },
  { immediate: true }
);

// Static nav items (Discord home, etc.)
const STATIC_NAV_ITEMS = [
  {
    label: "Discord",
    avatar: "/logo.png",
    to: "/@me/channels",
    metadata: { prefix: "/@me/channels" },
    isHome: true,
    notifications: 0,
    customBg: null,
    customText: null,
  },
];

// Computed nav items combining static and dynamic communities
const NAV_ITEMS = computed(() => {
  const communityNavItems = userCommunity.value.map((community: any) => ({
    label: community.name,
    avatar: community.avatar,
    to: `/community/introduce/${community.id}`,
    metadata: { prefix: `/community/@${community.id}`, id: community.id },
    notifications: getCommunityUnreadCount(community.id),
    customBg: null,
    customText: community.name.charAt(0).toUpperCase(),
  }));

  return [...STATIC_NAV_ITEMS, ...communityNavItems];
});

// Reactive unread counts cho mỗi community với caching tối ưu
const communityUnreadCounts = ref<Record<string, number>>({});

// Sử dụng unread manager cho tối ưu performance
const { getCachedCommunityUnreadCount, initializeUnreadForCommunities } =
  useUnreadManager();

// Function to get total unread count for a community (use cache for performance)
const getCommunityUnreadCount = (communityId: string) => {
  // Return cached count for performance, fallback to reactive state
  return (
    communityUnreadCounts.value[communityId] ||
    getCachedCommunityUnreadCount(communityId)
  );
};

// Function to fetch unread count với caching
const fetchCommunityUnreadCount = async (communityId: string) => {
  try {
    const count = await wsStore.fetchCommunityUnreadCount(communityId);
    communityUnreadCounts.value[communityId] = count;
  } catch (error) {
    
    // Fallback to cached local state
    const localCount = getCachedCommunityUnreadCount(communityId);
    communityUnreadCounts.value[communityId] = localCount;
  }
};

// Manual refresh function với debouncing để tránh quá nhiều calls
let refreshTimeout: NodeJS.Timeout | null = null;
const refreshAllCommunityUnreadCounts = async () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  refreshTimeout = setTimeout(async () => {
    const promises = userCommunity.value.map((community) =>
      fetchCommunityUnreadCount(community.id)
    );
    await Promise.all(promises);
    refreshTimeout = null;
  }, 300); // Debounce 300ms
};

// Expose refresh function to global scope for debugging
if (process.dev) {
  (window as any).refreshSidebarCounts = refreshAllCommunityUnreadCounts;
}

// Fetch unread counts for all communities when they change - với throttling
const lastFetchTime = ref<Record<string, number>>({});
watch(
  userCommunity,
  async (newCommunities) => {
    if (newCommunities && newCommunities.length > 0) {
      const now = Date.now();
      const promises = [];

      for (const community of newCommunities) {
        // Chỉ fetch nếu chưa fetch trong 10 giây gần đây
        const lastFetch = lastFetchTime.value[community.id] || 0;
        if (now - lastFetch > 10000) {
          lastFetchTime.value[community.id] = now;
          promises.push(fetchCommunityUnreadCount(community.id));
        } else {
          // Dùng cached value
          const cachedCount = getCachedCommunityUnreadCount(community.id);
          communityUnreadCounts.value[community.id] = cachedCount;
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }
  },
  { immediate: true }
);

// Watch for changes in WebSocket unread state to update sidebar counts
watch(
  () => wsStore.unreadByChannel,
  () => {
    // Recalculate unread counts for all communities when any channel's unread changes
    for (const community of userCommunity.value) {
      const localCount = wsStore.getUnreadCountForCommunity(community.id);
      communityUnreadCounts.value[community.id] = localCount;
    }
  },
  { deep: true }
);

// Watch route changes to refresh counts when switching communities
watch(
  () => route.path,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // Small delay to ensure community data is loaded
      setTimeout(async () => {
        await refreshAllCommunityUnreadCounts();
      }, 500);
    }
  }
);

// Tối ưu: Chỉ refresh khi thay đổi community và interval dài hơn
onMounted(() => {
  const refreshInterval = setInterval(async () => {
    // Chỉ refresh communities có hoạt động gần đây (có unread > 0)
    const activeCommunities = userCommunity.value.filter(
      (community) => getCommunityUnreadCount(community.id) > 0
    );

    if (activeCommunities.length > 0) {
      const promises = activeCommunities.map((community) =>
        fetchCommunityUnreadCount(community.id)
      );
      await Promise.all(promises);
    }
  }, 60000); // Tăng lên 60 giây thay vì 30 giây

  onUnmounted(() => {
    clearInterval(refreshInterval);
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
  });
});

const isActiveNav = (nav: any) => {
  if (nav.isHome) {
    return route.path === nav.metadata.prefix;
  } else {
    return communityStore.currentCommunity?.id === nav.metadata?.id;
  }
};

const createState = ref({
  name: "",
  description: "",
  avatar: "",
  banner: "",
  isPrivate: false,
});

const isLoading = ref(false);

async function createGuild() {
  try {
    isLoading.value = true;
    // ✅ Kiểm tra dữ liệu trước khi gửi
    if (!createState.value.name.trim()) {
      toast.add({
        title: "Tên máy chủ không được để trống",
        color: "error",
      });
      isLoading.value = false;
      return;
    }

    await communityStore.createCommunity(createState.value);

    // ✅ Reset lại state sau khi tạo thành công
    createState.value = {
      name: "",
      description: "",
      avatar: "",
      banner: "",
      isPrivate: false,
    };

    isOpen.value = false;
  } catch (error) {
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <aside
    class="fixed top-0 left-0 h-screen w-20 bg-gray-900 flex flex-col items-center py-3 gap-3 overflow-y-auto scrollbar-hide"
  >
    <!-- Nav items -->
    <div
      v-for="nav in NAV_ITEMS"
      :key="nav.to"
      class="relative group w-full flex justify-center"
    >
      <NuxtLink :to="nav.to" class="relative flex items-center">
        <!-- Unread indicator bar -->
        <div
          v-if="nav.notifications > 0"
          class="w-1 h-4 bg-white rounded-full flex-shrink-0 mr-2"
        ></div>
        <!-- Spacer when no unread -->
        <div v-else class="w-1 flex-shrink-0 mr-2"></div>

        <div
          :class="[
            'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden',
            isActiveNav(nav)
              ? 'rounded-2xl bg-indigo-600'
              : 'bg-gray-700 hover:bg-indigo-600 hover:rounded-2xl',
          ]"
        >
          <template v-if="nav.avatar">
            <img
              :src="nav.avatar"
              :alt="nav.label"
              class="w-full h-full object-cover"
            />
          </template>
          <template v-else>
            <div
              :class="[
                'w-full h-full flex items-center justify-center text-white font-bold',
                nav.customBg || 'bg-gray-700',
              ]"
            >
              {{ nav.customText || nav.label.charAt(0) }}
            </div>
          </template>
        </div>

        <!-- Active indicator -->
        <div
          v-if="isActiveNav(nav)"
          class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full -ml-3"
        />
      </NuxtLink>

      <!-- Tooltip -->
      <div
        class="absolute left-20 top-1/2 transform -translate-y-1/2 bg-black text-white px-3 py-1 rounded-md text-sm font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50"
      >
        {{ nav.label }}
      </div>
    </div>

    <!-- Add / Explore buttons -->
    <div class="mt-auto flex flex-col gap-2 w-full items-center pb-15">
      <ThemeToggle />
      <UModal v-model:open="isOpen" title="Tạo máy chủ của bạn">
        <UButton
          class="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-500 flex items-center justify-center transition-all duration-200"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-6 h-6 text-green-500 group-hover:text-white"
          />
        </UButton>

        <template #body>
          <div class="flex flex-col items-center justify-center">
            <CreateGuildForm
              placeholder-icon="i-lucide-user"
              @uploaded="createState.avatar = $event"
            />
          </div>

          <UFormField label="Tên máy chủ">
            <UInput
              v-model="createState.name"
              placeholder="Nhập tên máy chủ"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Mô tả máy chủ" class="mt-4">
            <UTextarea
              v-model="createState.description"
              placeholder="Nhập mô tả máy chủ"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <div class="flex justify-between mt-4">
            <span>Riêng tư</span>
            <USwitch v-model="createState.isPrivate" />
          </div>

          <!-- Nút Tạo máy chủ căn phải -->
          <div class="flex justify-end mt-4">
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              :disabled="isLoading"
              @click="createGuild"
            >
              Tạo máy chủ
            </UButton>
          </div>
        </template>
      </UModal>
      <UButton
        class="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-500 flex items-center justify-center transition-all duration-200"
        to="/community/discover"
      >
        <UIcon
          name="i-lucide-compass"
          class="w-6 h-6 text-green-500 group-hover:text-white"
        />
      </UButton>
    </div>
  </aside>
</template>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
