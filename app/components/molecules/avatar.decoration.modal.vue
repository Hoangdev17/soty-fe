<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";
import { useBreakpoint } from "~/composables/useBreakpoint.client";

interface Props {
  open: boolean;
  userId?: string;
  currentAvatar?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "updated", decoration: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { isMobile } = useBreakpoint();

const authStore = useAuthStore();
const offset = ref(0);
const limit = ref(20);
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
  { label: "Không có hiệu ứng", value: null, preview: null },
  ...(authStore.decoration || []).map((decoration) => {
    const previewUrl =
      decoration.metadata?.link || decoration.metadata?.image || null;
    return {
      label: decoration.name,
      value: decoration.id,
      preview: previewUrl,
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
    await authStore.fetchAvatarDecorations(offset.value, limit.value);
    offset.value += limit.value;
  } catch (error) {
    console.error("Error fetching decorations:", error);
  } finally {
    isLoading.value = false;
  }
};

const applyDecoration = async () => {
  if (!props.userId) return;

  isApplying.value = true;

  try {
    // Update user avatar effect
    await authStore.updateUserProfile({
      avatarEffectId: selectedDecoration.value,
    });

    emit("updated", selectedDecoration.value);
    closeModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: "Đã cập nhật hiệu ứng avatar.",
      color: "success",
    });
  } catch (error: any) {
    console.error("Error applying decoration:", error);

    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể cập nhật hiệu ứng avatar.",
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
      selectedDecoration.value = authStore.userInfo?.avatarEffectId ?? null;
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
    await authStore.fetchAvatarDecorations(offset.value, limit.value);
    isLoadingMore.value = false;
  } catch (error) {
    console.error("Error loading more decorations:", error);
  } finally {
    isLoadingMore.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-3xl">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-palette" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Trang trí Avatar</h3>
      </div>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-primary"
        />
        <span class="ml-2">Đang tải trang trí...</span>
      </div>
      <div
        v-else
        :class="isMobile ? 'flex flex-col gap-6' : 'flex gap-6'"
        class="max-h-96 overflow-y-auto scrollbar-hide"
      >
        <!-- Avatar Preview Section - Mobile: Top and Sticky -->
        <div
          v-if="isMobile"
          class="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-4"
        >
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-sm font-medium mb-4 text-center">
              Xem trước Avatar
            </h4>
            <div class="flex flex-col items-center space-y-4">
              <div class="relative w-24 h-24 flex items-center justify-center">
                <!-- Avatar ở dưới -->
                <UAvatar :src="currentAvatar" size="lg" class="w-20 h-20" />

                <!-- Effect đè lên avatar -->
                <img
                  v-if="
                    selectedDecoration &&
                    selectedDecorationItem?.preview?.startsWith('http')
                  "
                  :src="selectedDecorationItem.preview"
                  class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-10"
                  alt="Effect overlay"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Options Section -->
        <div class="flex-1 space-y-6">
          <!-- Avatar Effects Selection -->
          <div>
            <label class="block text-sm font-medium mb-2"
              >Hiệu ứng Avatar</label
            >
            <div
              :class="
                isMobile ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-4 gap-2'
              "
            >
              <UTooltip
                v-for="decoration in decorationOptions"
                :key="decoration.value || 'none'"
                :text="decoration.label"
              >
                <UCard
                  :class="[
                    'cursor-pointer transition-all aspect-square flex items-center justify-center',
                    selectedDecoration === decoration.value
                      ? 'ring-2 ring-primary'
                      : 'hover:ring-1 hover:ring-gray-300',
                  ]"
                  @click="selectedDecoration = decoration.value"
                >
                  <div class="w-full h-full flex items-center justify-center">
                    <img
                      v-if="
                        decoration.preview &&
                        decoration.preview.startsWith('http')
                      "
                      :src="decoration.preview"
                      :alt="decoration.label"
                      class="w-full h-full object-contain"
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

        <!-- Avatar Preview Section - Desktop -->
        <div v-if="!isMobile" class="w-80 sticky top-0 self-start">
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-sm font-medium mb-4 text-center">
              Xem trước Avatar
            </h4>
            <div class="flex flex-col items-center space-y-4">
              <div class="relative w-24 h-24 flex items-center justify-center">
                <!-- Avatar ở dưới -->
                <UAvatar :src="currentAvatar" size="lg" class="w-20 h-20" />

                <!-- Effect đè lên avatar -->
                <img
                  v-if="
                    selectedDecoration &&
                    selectedDecorationItem?.preview?.startsWith('http')
                  "
                  :src="selectedDecorationItem.preview"
                  class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-10"
                  alt="Effect overlay"
                />
              </div>
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
