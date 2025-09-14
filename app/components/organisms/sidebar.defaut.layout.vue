<script setup lang="ts">
import { useRoute } from "vue-router";
import { useCommunityStore } from "~/stores/community/community.store";
import CreateGuildForm from "../molecules/create.guild.form.vue";
const toast = useToast();

const route = useRoute();
const communityStore = useCommunityStore();
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

          // Luôn fetch community mới để đảm bảo data được clear và update đúng
          try {
            await communityStore.fetchCommunityById(communityId);
          } catch (error) {
            console.error("❌ Sidebar: Error fetching community:", error);
          } finally {
            // Reset flag sau khi fetch xong
          }
        }
      }
    } else {
      communityStore.currentCommunity = null;
    }
  },
  { immediate: true } // Chạy ngay khi component mount
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
    notifications: 0,
    customBg: null,
    customText: community.name.charAt(0).toUpperCase(),
  }));

  return [...STATIC_NAV_ITEMS, ...communityNavItems];
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
  avatar: undefined as string | undefined,
  banner: undefined as File | undefined,
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
      avatar: undefined,
      banner: undefined,
      isPrivate: false,
    };

    isOpen.value = false;
  } catch (error) {
    console.error("Lỗi khi tạo máy chủ:", error);
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
      <NuxtLink :to="nav.to" class="relative">
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

        <!-- Notification badge -->
        <div
          v-if="nav.notifications"
          class="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
        >
          {{ nav.notifications }}
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
              rows="3"
            />
          </UFormField>

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
