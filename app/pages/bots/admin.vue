<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBotStore } from "~/stores/bots/bot.store";
import type { Bot, BotSkill } from "~/stores/bots/bot.type";
import { TriggerType } from "~/stores/bots/bot.type";

definePageMeta({
  layout: "main",
});

const botStore = useBotStore();
const toast = useToast();

// Loading states
const loading = ref(true);

// Modal states
const isCreateBotModalOpen = ref(false);

// Selected items
const selectedBot = ref<Bot | null>(null);
const selectedSkill = ref<BotSkill | null>(null);

// Computed
const bots = computed(() => botStore.bots);

// Lifecycle
onMounted(async () => {
  try {
    loading.value = true;
    await botStore.fetchAllBot();
  } catch (error) {
    console.error("Failed to load bots:", error);
    toast.add({
      title: "Lỗi!",
      description: "Không thể tải danh sách bot",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              ⚙️ Bot Admin Panel
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Quản lý bots, actions và commands
            </p>
          </div>
          <UButton size="lg" @click="isCreateBotModalOpen = true">
            <template #leading>
              <span class="text-lg">➕</span>
            </template>
            Tạo Bot Mới
          </UButton>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <OrganismsTabBotAdmin
      v-model:selected-bot="selectedBot"
      v-model:selected-skill="selectedSkill"
    />
  </div>

  <OrganismsCreateBotModal v-model:open="isCreateBotModalOpen" />
</template>
