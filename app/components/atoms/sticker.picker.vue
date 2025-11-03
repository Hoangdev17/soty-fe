<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCommunityStore } from "~/stores/community/community.store";
import type { GuildSticker } from "~/stores/community/community.type";

const props = defineProps<{
  guildId: string;
}>();

const emit = defineEmits<{
  select: [stickerUrl: string];
}>();

const communityStore = useCommunityStore();
const searchQuery = ref("");
const isSearching = ref(false);
const selectedCategory = ref<"guild" | "tenor">("guild");

// Categories for sidebar
const categories = [
  { id: "guild", icon: "⭐", label: "Guild Stickers" },
  { id: "tenor", icon: "🔍", label: "Tenor" },
];

const selectSticker = (sticker: GuildSticker) => {
  emit("select", sticker.url || "");
};

// Search Tenor stickers
const searchTenorStickers = async () => {
  if (!searchQuery.value.trim() || !props.guildId) return;

  isSearching.value = true;
  try {
    await communityStore.searchStickersByTenor(
      searchQuery.value,
      30,
      props.guildId,
      "all"
    );
    selectedCategory.value = "tenor";
  } catch (error) {
    console.error("Failed to search stickers:", error);
  } finally {
    isSearching.value = false;
  }
};

// Debounce search
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, (val) => {
  clearTimeout(searchTimeout);
  if (val.trim()) {
    searchTimeout = setTimeout(() => {
      searchTenorStickers();
    }, 500);
  }
});

// Load community stickers and trending on mount
onMounted(async () => {
  if (props.guildId) {
    try {
      await communityStore.fetchCommunityStickers(props.guildId);
      // Load trending
      await communityStore.searchStickersByTenor(
        "trending",
        20,
        props.guildId,
        "all"
      );
    } catch (error) {
      console.error("Failed to fetch stickers:", error);
    }
  }
});
</script>

<template>
  <div
    class="sticker-picker bg-[#2f3136] rounded-lg shadow-xl border border-gray-700 flex overflow-hidden"
    style="width: 520px; height: 435px"
  >
    <!-- Left Sidebar -->
    <div
      class="sidebar bg-[#232428] w-12 flex flex-col items-center py-2 gap-2 border-r border-gray-700"
    >
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectedCategory = cat.id as any"
        :class="[
          'w-9 h-9 rounded flex items-center justify-center transition-colors text-xl',
          selectedCategory === cat.id
            ? 'bg-[#5865f2] text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200',
        ]"
        :title="cat.label"
      >
        {{ cat.icon }}
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Search bar -->
      <div class="p-3 border-b border-gray-700">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm sticker"
            class="w-full pl-3 pr-10 py-2 bg-[#1e1f22] border-none rounded text-sm text-gray-200 placeholder-gray-400 focus:outline-none"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
            🎭
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isSearching" class="flex-1 flex justify-center items-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        ></div>
      </div>

      <!-- Sticker Content -->
      <div v-else class="flex-1 overflow-y-auto p-3">
        <!-- Guild Stickers -->
        <div v-if="selectedCategory === 'guild'">
          <!-- All Guild Stickers -->
          <div
            v-if="
              communityStore.GuildStickers &&
              communityStore.GuildStickers.length > 0
            "
            class="mb-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-base">⭐</span>
              <h3 class="text-xs font-semibold text-gray-300 uppercase">
                Sticker guild
              </h3>
              <span class="text-xs text-gray-500"
                >({{ communityStore.GuildStickers.length }})</span
              >
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="sticker in communityStore.GuildStickers"
                :key="sticker.id"
                @click="selectSticker(sticker)"
                class="sticker-button hover:bg-gray-700 rounded p-2 transition-all cursor-pointer aspect-square relative group"
                :title="sticker.name"
              >
                <img
                  :src="sticker.url"
                  :alt="sticker.name"
                  class="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            </div>
          </div>

          <!-- Empty state for guild -->
          <div
            v-if="
              !communityStore.GuildStickers ||
              communityStore.GuildStickers.length === 0
            "
            class="text-center text-gray-400 py-12"
          >
            <UIcon
              name="i-lucide-sticker"
              class="w-12 h-12 mx-auto mb-3 opacity-50"
            />
            <p class="text-sm">Chưa có sticker nào trong guild</p>
          </div>
        </div>

        <!-- Tenor Results -->
        <div v-if="selectedCategory === 'tenor'">
          <div
            v-if="
              communityStore.GuildStickers &&
              communityStore.GuildStickers.length > 0
            "
            class="mb-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-base">🔥</span>
              <h3 class="text-xs font-semibold text-gray-300 uppercase">
                {{ searchQuery.trim() ? "Kết quả" : "Trending" }}
              </h3>
              <span class="text-xs text-gray-500"
                >({{ communityStore.GuildStickers.length }})</span
              >
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="sticker in communityStore.GuildStickers"
                :key="sticker.id"
                @click="selectSticker(sticker)"
                class="sticker-button hover:bg-gray-700 rounded p-2 transition-all cursor-pointer aspect-square relative group"
                :title="sticker.name"
              >
                <img
                  :src="sticker.url"
                  :alt="sticker.name"
                  class="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            </div>
          </div>

          <!-- No results -->
          <div
            v-if="
              searchQuery.trim() &&
              (!communityStore.GuildStickers ||
                communityStore.GuildStickers.length === 0) &&
              !isSearching
            "
            class="text-center text-gray-400 py-8"
          >
            <UIcon
              name="i-lucide-search-x"
              class="w-12 h-12 mx-auto mb-3 opacity-50"
            />
            <p class="text-sm">Không tìm thấy sticker</p>
            <p class="text-xs mt-1">Thử từ khóa khác</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticker-grid::-webkit-scrollbar,
.flex-1.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.sticker-grid::-webkit-scrollbar-track,
.flex-1.overflow-y-auto::-webkit-scrollbar-track {
  background: #2f3136;
}

.sticker-grid::-webkit-scrollbar-thumb,
.flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #1e1f22;
  border-radius: 3px;
}

.sticker-grid::-webkit-scrollbar-thumb:hover,
.flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #2f3136;
}

.sticker-button:hover {
  transform: scale(1.02);
}

.sticker-button img {
  transition: transform 0.2s;
}

.sticker-button:hover img {
  transform: scale(1.05);
}

.sidebar button {
  position: relative;
}

.sidebar button::after {
  content: "";
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  background: white;
  border-radius: 0 4px 4px 0;
  transition: all 0.2s;
}

.sidebar button.bg-\[\#5865f2\]::after {
  width: 4px;
  height: 20px;
}
</style>
