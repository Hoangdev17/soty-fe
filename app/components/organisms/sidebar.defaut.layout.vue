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

          // Tìm community trong list và set current
          const community = userCommunity.value.find(
            (c: any) => c.id == communityId
          );
          if (community) {
            communityStore.currentCommunity = community;
          } else {
            // Nếu không tìm thấy, fetch từ API
            try {
              await communityStore.fetchCommunityById(communityId);
            } catch (error) {
              console.error("Error fetching community:", error);
            }
          }
        }
      }
    }
  },
  { immediate: true } // Chạy ngay khi component mount
);

// Static nav items (Discord home, etc.)
const STATIC_NAV_ITEMS = [
  {
    label: "Discord",
    avatar:
      "data:image/png;base64,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",
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
    to: `/community/@${community.name}-${community.id}`,
    metadata: { prefix: `/community/@${community.id}` },
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
    return route.path.startsWith(nav.to);
  }
};

const createState = ref({
  name: "",
  description: "",
  avatar: undefined as File | undefined,
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

    console.log("Tạo máy chủ thành công!");
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
            <CreateGuildForm placeholder-icon="i-lucide-user" />
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
