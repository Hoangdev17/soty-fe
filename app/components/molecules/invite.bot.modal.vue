<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Bot } from "~/stores/bots/bot.type";
import type { Community } from "~/stores/community/community.type";
import { useCommunityStore } from "~/stores/community/community.store";
import { useBotStore } from "~/stores/bots/bot.store";

interface Props {
  open?: boolean;
  bot?: Bot | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "invited", data: { botId: string; communityId: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  bot: null,
});

const emit = defineEmits<Emits>();

const communityStore = useCommunityStore();
const botStore = useBotStore();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const selectedBot = computed(() => props.bot);
const botName = computed(() => selectedBot.value?.username || "Bot");

const loadingCommunities = ref(false);
const communities = ref<Community[]>([]);
const selectedCommunityId = ref<string | null>(null);
const searchQuery = ref("");
const isInviting = ref(false);

// Filtered communities based on search
const filteredCommunities = computed(() => {
  if (!searchQuery.value) return communities.value;

  const query = searchQuery.value.toLowerCase();
  return communities.value.filter((community) =>
    community.name.toLowerCase().includes(query)
  );
});

// Watch for modal open to load communities
watch(
  () => props.open,
  async (newValue) => {
    if (newValue) {
      await loadCommunities();
    } else {
      // Reset state when modal closes
      selectedCommunityId.value = null;
      searchQuery.value = "";
    }
  }
);

const loadCommunities = async () => {
  try {
    loadingCommunities.value = true;
    // Fetch user's communities
    await communityStore.fetchCommunities();
    communities.value = communityStore.communities || [];
  } catch (error) {
    console.error("Failed to load communities:", error);
    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: "Không thể tải danh sách community",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    loadingCommunities.value = false;
  }
};

const selectCommunity = (community: Community) => {
  selectedCommunityId.value = community.id;
};

const handleInviteBot = async () => {
  if (!selectedBot.value || !selectedCommunityId.value) return;

  try {
    isInviting.value = true;

    // Call API to invite bot to community
    await botStore.inviteBotToCommunity(
      selectedBot.value.id,
      selectedCommunityId.value
    );

    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: `Đã mời ${selectedBot.value.username} vào community`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    // Emit success event
    emit("invited", {
      botId: selectedBot.value.id,
      communityId: selectedCommunityId.value,
    });

    // Close modal
    closeModal();
  } catch (error: any) {
    console.error("Failed to invite bot:", error);
    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể mời bot vào community",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    isInviting.value = false;
  }
};

const closeModal = () => {
  isOpen.value = false;
};
</script>

<template>
  <UModal v-model:open="isOpen" :title="`Mời ${botName} vào Community`">
    <template #content>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Chọn Community
          </h3>
          <UButton
            icon="i-heroicons-x-mark-20-solid"
            variant="ghost"
            size="sm"
            @click="closeModal"
          />
        </div>

        <!-- Bot Info -->
        <div
          v-if="selectedBot"
          class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center gap-4">
            <div class="relative">
              <UAvatar
                v-if="selectedBot.avatar"
                :src="selectedBot.avatar"
                :alt="selectedBot.username"
                class="w-16 h-16 rounded-full object-cover"
              />
              <div
                v-else
                class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-2xl"
              >
                🤖
              </div>
              <div
                v-if="selectedBot.isVerified"
                class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <span class="text-white text-xs">✓</span>
              </div>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900 dark:text-white">
                {{ selectedBot.username }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ selectedBot.bio || "Không có mô tả" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loadingCommunities" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
          ></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Đang tải danh sách community...
          </p>
        </div>

        <!-- Communities List -->
        <div v-else-if="communities.length > 0" class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Chọn community mà bạn muốn thêm bot này:
          </p>

          <!-- Search Community -->
          <UInput
            v-model="searchQuery"
            placeholder="Tìm kiếm community..."
            icon="i-heroicons-magnifying-glass-20-solid"
            class="mb-4"
          />

          <!-- Community List -->
          <div class="max-h-96 overflow-y-auto space-y-2">
            <div
              v-for="community in filteredCommunities"
              :key="community.id"
              @click="selectCommunity(community)"
              :class="[
                'p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                selectedCommunityId === community.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700',
              ]"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="community.avatar"
                  :src="community.avatar"
                  :alt="community.name"
                  class="w-12 h-12 rounded-lg object-cover"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl font-bold text-white"
                >
                  {{ community.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                  <h5 class="font-semibold text-gray-900 dark:text-white">
                    {{ community.name }}
                  </h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ community.memberCount }} thành viên
                  </p>
                </div>
                <div
                  v-if="selectedCommunityId === community.id"
                  class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <span class="text-white text-xs">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <div class="text-6xl mb-4">🏠</div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Chưa có community
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Bạn cần tạo hoặc tham gia một community trước khi mời bot.
          </p>
          <UButton @click="navigateTo('/community')">
            Khám phá Communities
          </UButton>
        </div>

        <!-- Action Buttons -->
        <div v-if="communities.length > 0" class="flex justify-end gap-3 mt-6">
          <UButton variant="ghost" @click="closeModal"> Hủy </UButton>
          <UButton
            :disabled="!selectedCommunityId || isInviting"
            :loading="isInviting"
            @click="handleInviteBot"
          >
            {{ isInviting ? "Đang mời..." : "Mời Bot" }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
