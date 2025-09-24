<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

interface Props {
  open: boolean;
  userId?: string;
  currentNametag?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "updated", decoration: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const offset = ref(0);
const limit = ref(20);
const { isMobile } = useBreakpoint();

// State
const isApplying = ref(false);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const selectedDecoration = ref<string | null>(null);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const decorationOptions = computed(() => [
  { label: "Không có nametag", value: null, preview: null },
  ...(authStore.nameTagDecoration || []).map((decoration) => {
    // Nameplate videos are in metadata.asset path
    const previewUrl = decoration.metadata?.asset
      ? `https://cdn.discordapp.com/assets/collectibles/${decoration.metadata.asset}asset.webm`
      : null;
    return {
      label: decoration.name,
      value: decoration.id,
      preview: previewUrl,
      metadata: decoration.metadata,
    };
  }),
]);

// Selected decoration object for preview
const selectedDecorationItem = computed(() =>
  decorationOptions.value.find(
    (item) => item.value === selectedDecoration.value
  )
);

// Methods
const fetchDecorations = async () => {
  isLoading.value = true;
  try {
    await authStore.fetchNameTagDecorations(offset.value, limit.value);
    offset.value += limit.value;
  } catch (error) {
    console.error("Error fetching nametag decorations:", error);
  } finally {
    isLoading.value = false;
  }
};

const applyDecoration = async () => {
  if (!props.userId) return;

  isApplying.value = true;

  try {
    // Update user nametag
    await authStore.updateUserProfile({
      nameplateId: selectedDecoration.value,
    });

    emit("updated", selectedDecoration.value);
    closeModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: "Đã cập nhật nametag.",
      color: "success",
    });
  } catch (error: any) {
    console.error("Error applying nametag decoration:", error);

    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể cập nhật nametag.",
      color: "error",
    });
  } finally {
    isApplying.value = false;
  }
};

const closeModal = () => {
  isOpen.value = false;
  resetSelection();
  offset.value = 0;
  limit.value = 20;
};

const resetSelection = () => {
  selectedDecoration.value = null;
};

// Watch for modal open
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await fetchDecorations();
      selectedDecoration.value = authStore.userInfo?.nameplateId ?? null;
    } else {
      selectedDecoration.value = null;
      offset.value = 0;
      limit.value = 20;
      isLoading.value = false;
      isLoadingMore.value = false;
      isApplying.value = false;
    }
  }
);

async function loadMoreDecorations() {
  isLoadingMore.value = true;
  offset.value += limit.value;
  try {
    await authStore.fetchNameTagDecorations(offset.value, limit.value);
    isLoadingMore.value = false;
  } catch (error) {
    console.error("Error loading more nametag decorations:", error);
  } finally {
    isLoadingMore.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-3xl">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-tag" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Trang trí Nametag</h3>
      </div>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-primary"
        />
        <span class="ml-2">Đang tải nametag...</span>
      </div>
      <div v-else class="flex gap-6 max-h-96 overflow-y-auto scrollbar-hide">
        <!-- Options Section -->
        <div class="flex-1 space-y-6">
          <!-- Nametag Selection -->
          <div v-if="isMobile" class="w-80">
            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h4 class="text-sm font-medium mb-4 text-center">
                Xem trước Nametag
              </h4>
              <div class="flex flex-col items-center space-y-4">
                <!-- Preview giống floating user card -->
                <div
                  class="text-white shadow-lg rounded-xl p-3 w-72 flex items-center justify-between transition-all duration-300 overflow-hidden relative bg-gray-900/90"
                >
                  <!-- Nameplate background video cho toàn bộ preview card -->
                  <video
                    v-if="selectedDecoration && selectedDecorationItem?.preview"
                    class="absolute inset-0 w-full h-full object-cover rounded-xl"
                    loop
                    muted
                    autoplay
                    playsinline
                    :src="selectedDecorationItem.preview"
                    style="z-index: 1"
                  />

                  <!-- Overlay để đảm bảo text dễ đọc khi có nameplate -->
                  <div
                    v-if="selectedDecoration"
                    class="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-xl"
                    style="z-index: 2"
                  ></div>

                  <!-- Avatar + Info -->
                  <div class="flex items-center gap-2 relative z-10">
                    <div class="relative w-10 h-10">
                      <!-- Avatar -->
                      <div
                        class="w-10 h-10 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center"
                      >
                        <img
                          v-if="authStore.user?.avatar"
                          :src="authStore.user.avatar"
                          :alt="authStore.user?.username || 'avatar'"
                          class="w-full h-full rounded-full object-cover"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-user"
                          class="w-5 h-5 text-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <!-- Username -->
                      <h3
                        class="font-semibold text-sm text-white drop-shadow-lg"
                      >
                        {{ authStore.user?.username || "Username" }}
                      </h3>
                      <p class="text-xs text-gray-300">Online</p>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="flex gap-1 relative z-10">
                    <div
                      class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                    >
                      <UIcon
                        name="i-lucide-mic"
                        class="w-3 h-3 text-gray-300"
                      />
                    </div>
                    <div
                      class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                    >
                      <UIcon
                        name="i-lucide-phone"
                        class="w-3 h-3 text-gray-300"
                      />
                    </div>
                    <div
                      class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                    >
                      <UIcon
                        name="i-lucide-settings"
                        class="w-3 h-3 text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <!-- Preview description -->
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Nametag</label>
            <div
              class="grid grid-cols-2 gap-2"
              :class="isMobile ? 'grid-cols-2' : 'grid-cols-2'"
            >
              <UTooltip
                v-for="decoration in decorationOptions"
                :key="decoration.value || 'none'"
                :text="decoration.label"
              >
                <UCard
                  :class="[
                    'cursor-pointer transition-all flex items-center justify-center',
                    selectedDecoration === decoration.value
                      ? 'ring-2 ring-primary'
                      : 'hover:ring-1 hover:ring-gray-300',
                  ]"
                  @click="selectedDecoration = decoration.value"
                  style="aspect-ratio: 3/1; min-height: 40px"
                >
                  <div
                    class="w-full h-full flex items-center justify-center relative"
                  >
                    <video
                      v-if="decoration.preview"
                      class="w-full h-full object-cover rounded-lg"
                      loop
                      muted
                      autoplay
                      playsinline
                      :src="decoration.preview"
                    />

                    <div
                      v-else
                      class="w-8 h-8 border-2 border-gray-300 rounded-full"
                    ></div>
                  </div>
                </UCard>
              </UTooltip>
            </div>
          </div>

          <UButton
            @click="loadMoreDecorations"
            class="w-full items-center justify-center"
            variant="outline"
            >Xem thêm</UButton
          >
        </div>

        <!-- Nametag Preview Section -->
        <div v-if="!isMobile" class="w-80 sticky top-0 self-start">
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-sm font-medium mb-4 text-center">
              Xem trước Nametag
            </h4>
            <div class="flex flex-col items-center space-y-4">
              <!-- Preview giống floating user card -->
              <div
                class="text-white shadow-lg rounded-xl p-3 w-72 flex items-center justify-between transition-all duration-300 overflow-hidden relative bg-gray-900/90"
              >
                <!-- Nameplate background video cho toàn bộ preview card -->
                <video
                  v-if="selectedDecoration && selectedDecorationItem?.preview"
                  class="absolute inset-0 w-full h-full object-cover rounded-xl"
                  loop
                  muted
                  autoplay
                  playsinline
                  :src="selectedDecorationItem.preview"
                  style="z-index: 1"
                />

                <!-- Overlay để đảm bảo text dễ đọc khi có nameplate -->
                <div
                  v-if="selectedDecoration"
                  class="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-xl"
                  style="z-index: 2"
                ></div>

                <!-- Avatar + Info -->
                <div class="flex items-center gap-2 relative z-10">
                  <div class="relative w-10 h-10">
                    <!-- Avatar -->
                    <div
                      class="w-10 h-10 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center"
                    >
                      <img
                        v-if="authStore.user?.avatar"
                        :src="authStore.user.avatar"
                        :alt="authStore.user?.username || 'avatar'"
                        class="w-full h-full rounded-full object-cover"
                      />
                      <UIcon
                        v-else
                        name="i-lucide-user"
                        class="w-5 h-5 text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <!-- Username -->
                    <h3 class="font-semibold text-sm text-white drop-shadow-lg">
                      {{ authStore.user?.username || "Username" }}
                    </h3>
                    <p class="text-xs text-gray-300">Online</p>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="flex gap-1 relative z-10">
                  <div
                    class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                  >
                    <UIcon name="i-lucide-mic" class="w-3 h-3 text-gray-300" />
                  </div>
                  <div
                    class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-phone"
                      class="w-3 h-3 text-gray-300"
                    />
                  </div>
                  <div
                    class="w-6 h-6 bg-gray-700/50 rounded flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-settings"
                      class="w-3 h-3 text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <!-- Preview description -->
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          color="neutral"
          @click="
            () => {
              isOpen = false;
              closeModal();
            }
          "
          :disabled="isApplying"
        >
          Hủy
        </UButton>
        <UButton color="primary" @click="applyDecoration" :loading="isApplying">
          Áp dụng
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.scrollbar-hide {
  /* Hide scrollbar for Chrome, Safari and Opera */
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
