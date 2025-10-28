<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBotStore } from "~/stores/bots/bot.store";
import type { Bot } from "~/stores/bots/bot.type";

// Initialize bot store
const botStore = useBotStore();
const loading = ref(true);

const searchQuery = ref("");
const selectedCategory = ref("all");

// Modal state
const isInviteModalOpen = ref(false);
const selectedBotForInvite = ref<Bot | null>(null);

// Fetch bots from API on component mount
onMounted(async () => {
  try {
    loading.value = true;
    await botStore.fetchAllBot();
  } catch (error) {
    console.error("Failed to fetch bots:", error);
  } finally {
    loading.value = false;
  }
});

// Get bots from store
const bots = computed(() => botStore.bots);

const categories = computed(() => {
  // Extract unique categories from bots if they have a category field
  // For now, return default categories since Bot type doesn't include category
  return ["all", "Tiện ích", "Giải trí", "Trò chơi"];
});

const filteredBots = computed(() => {
  return bots.value.filter((bot) => {
    const matchesSearch =
      bot.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (bot.bio &&
        bot.bio.toLowerCase().includes(searchQuery.value.toLowerCase()));

    // Since Bot type doesn't have category field, we'll show all bots for now
    const matchesCategory = selectedCategory.value === "all";

    return matchesSearch && matchesCategory;
  });
});

const totalBots = computed(() => bots.value.length);
const verifiedBots = computed(
  () => bots.value.filter((b) => b.isVerified).length
);
const onlineBots = computed(
  () => bots.value.filter((b) => b.presence?.status === "ONLINE").length
);

const getStatusBadge = (presence: any) => {
  const status = presence?.status || "OFFLINE";
  switch (status) {
    case "ONLINE":
      return { color: "green", label: "Online" };
    case "IDLE":
      return { color: "yellow", label: "Idle" };
    case "DND":
      return { color: "red", label: "Do Not Disturb" };
    case "OFFLINE":
    default:
      return { color: "gray", label: "Offline" };
  }
};

const getAvatarUrl = (bot: Bot) => {
  if (bot.avatar) {
    return bot.avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    bot.username
  )}&background=random`;
};

const inviteBot = (bot: Bot) => {
  selectedBotForInvite.value = bot;
  isInviteModalOpen.value = true;
};

const handleBotInvited = (data: { botId: string; communityId: string }) => {
  console.log("Bot invited successfully:", data);
};

const viewDetails = (bot: Bot) => {
  navigateTo(`/bots/${bot.id}`);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with gradient background -->
    <div
      class="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-5xl font-extrabold mb-4 drop-shadow-lg">
            🤖 Bot Marketplace
          </h1>
          <p class="text-xl text-white/90 max-w-2xl mx-auto">
            Khám phá và thêm các bot tuyệt vời vào Discord server của bạn
          </p>

          <!-- Admin Button -->
          <div class="mt-6">
            <UButton
              @click="navigateTo('/bots/admin')"
              size="lg"
              variant="outline"
              class="bg-white/10 backdrop-blur-lg border-white/30 text-white hover:bg-white/20"
            >
              <template #leading>
                <span class="text-lg">⚙️</span>
              </template>
              Bot Admin Panel
            </UButton>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div
            class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white/80 text-sm font-medium mb-1">Tổng Bots</p>
                <p class="text-4xl font-bold">{{ totalBots }}</p>
              </div>
              <div
                class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"
              >
                🤖
              </div>
            </div>
          </div>

          <div
            class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white/80 text-sm font-medium mb-1">
                  Bots Online
                </p>
                <p class="text-4xl font-bold">{{ onlineBots }}</p>
              </div>
              <div
                class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"
              >
                ✅
              </div>
            </div>
          </div>

          <div
            class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white/80 text-sm font-medium mb-1">
                  Verified Bots
                </p>
                <p class="text-4xl font-bold">{{ verifiedBots }}</p>
              </div>
              <div
                class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"
              >
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Bots Grid -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="text-6xl mb-4">⏳</div>
          <p class="text-xl text-gray-600 dark:text-gray-400">
            Đang tải danh sách bot...
          </p>
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          v-for="bot in filteredBots"
          :key="bot.id"
          class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
        >
          <!-- Card Header -->
          <div class="relative p-6 pb-4">
            <div class="flex items-start justify-between mb-3">
              <div class="relative">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-110 transition-transform duration-300"
                >
                  <UAvatar
                    v-if="bot.avatar"
                    :src="getAvatarUrl(bot)"
                    :alt="bot.username"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-4xl">🤖</span>
                </div>
                <div
                  v-if="bot.isVerified"
                  class="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span class="text-white text-xs">✓</span>
                </div>
              </div>

              <div
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  bot.presence?.status === 'ONLINE'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : bot.presence?.status === 'IDLE'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
                ]"
              >
                {{ getStatusBadge(bot.presence).label }}
              </div>
            </div>

            <h3
              class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            >
              {{ bot.username }}
            </h3>
            <p
              class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4"
            >
              {{ bot.bio || "Không có mô tả" }}
            </p>

            <!-- Badges -->
            <div
              v-if="bot.badges && bot.badges.length > 0"
              class="flex flex-wrap gap-2 mb-4"
            >
              <span
                v-for="(badge, index) in bot.badges.slice(0, 3)"
                :key="index"
                class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
              >
                {{ badge }}
              </span>
            </div>

            <!-- Stats -->
            <div
              class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4"
            >
              <div v-if="bot.premium" class="flex items-center gap-1">
                <span>⭐</span>
                <span class="font-medium">Premium</span>
              </div>
              <div class="flex items-center gap-1">
                <span>�</span>
                <span class="font-medium">{{
                  new Date(bot.createdAt).toLocaleDateString("vi-VN")
                }}</span>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div
            class="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700"
          >
            <div class="flex gap-2">
              <button
                @click="inviteBot(bot)"
                class="flex-1 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                ➕ Mời Bot
              </button>
              <button
                @click="viewDetails(bot)"
                class="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200"
              >
                ℹ️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredBots.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Không tìm thấy bot
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
        </p>
      </div>
    </div>

    <!-- Invite Bot Modal -->
    <MoleculesInviteBotModal
      v-model:open="isInviteModalOpen"
      :bot="selectedBotForInvite"
      @invited="handleBotInvited"
    />
  </div>
</template>
