<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

interface Props {
  open: boolean;
  userId?: string;
  currentProfileEffect?: string;
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

// State
const isApplying = ref(false);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const selectedDecoration = ref<string | null>(null);
const { isMobile } = useBreakpoint();
const isOpenModalPayment = ref(false);
const showModalSuccess = ref(false);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const decorationOptions = computed(() => {
  // Danh sách decoration user đang sở hữu
  const ownedIds = (authStore.userDecoration || []).map((d) => d.id);

  // Mặc định "Không có hiệu ứng"
  const defaultOption = {
    id: null,
    label: "Không có hiệu ứng",
    value: null,
    preview: null,
    metadata: {},
    owned: true,
    price: 0,
  };

  // Map tất cả decoration
  const allOptions = (authStore.profileDecoration || []).map((decoration) => {
    const previewUrl =
      decoration.metadata?.thumbnailPreviewSrc ||
      decoration.metadata?.reducedMotionSrc ||
      decoration.metadata?.staticFrameSrc ||
      decoration.metadata?.link ||
      decoration.metadata?.image ||
      null;

    return {
      id: decoration.id,
      label: decoration.name,
      value: decoration.id,
      preview: previewUrl,
      owned: ownedIds.includes(decoration.id),
      metadata: decoration.metadata || {},
      price: decoration.price || 0,
    };
  });

  return [defaultOption, ...allOptions];
});

// Selected decoration object for preview
const selectedDecorationItem = computed(() =>
  decorationOptions.value.find(
    (item) => item.value === selectedDecoration.value
  )
);

// Computed for animation style
const selectedDecorationAnimationStyle = computed(() => {
  if (!selectedDecorationItem.value?.metadata?.effects) return {};

  const effects = selectedDecorationItem.value.metadata.effects;
  const introEffect = effects.find((e: any) => !e.loop);
  const loopEffect = effects.find((e: any) => e.loop);

  if (!introEffect && !loopEffect) return {};

  // Calculate total animation duration
  const introDuration = introEffect?.duration || 0;
  const loopStart = loopEffect?.start || 0;
  const loopDuration = loopEffect?.duration || 0;
  const totalDuration = Math.max(
    introDuration + loopStart + loopDuration,
    8000
  ); // Minimum 8 seconds

  // Set CSS variables
  const style: any = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  if (introEffect) {
    style["--intro-src"] = `url(${introEffect.src})`;
    style.backgroundImage = `url(${introEffect.src})`; // Initial background
  }

  if (loopEffect) {
    style["--loop-src"] = `url(${loopEffect.src})`;
  }

  // Add animation
  style.animation = `profile-effect-preview ${totalDuration}ms infinite`;
  style.animationDelay = introEffect ? `${introEffect.start}ms` : "0ms";

  return style;
});

// Methods
const fetchDecorations = async () => {
  isLoading.value = true;
  try {
    await authStore.fetchProfileDecorations(offset.value, limit.value);
    offset.value += limit.value;
  } catch (error) {
    console.error("Error fetching profile decorations:", error);
  } finally {
    isLoading.value = false;
  }
};

const applyDecoration = async () => {
  if (!props.userId) return;

  isApplying.value = true;

  try {
    // Update user profile effect
    await authStore.updateUserProfile({
      profileEffectId: selectedDecoration.value,
    });

    emit("updated", selectedDecoration.value);

    closeModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: "Đã cập nhật hiệu ứng profile.",
      color: "success",
    });
  } catch (error: any) {
    console.error("Error applying profile decoration:", error);

    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể cập nhật hiệu ứng profile.",
      color: "error",
    });
  } finally {
    isApplying.value = false;
  }
};

const closeModal = async () => {
  isOpen.value = false;
  resetSelection();
  offset.value = 0;
  limit.value = 20;

  //reset state
  const store = useAuthStore();
  store.profileDecoration = [];

  await store.fetchProfileDecorationById(store.userInfo?.profileEffectId || "");
};

const resetSelection = () => {
  selectedDecoration.value = null;
};

// Watch for modal open
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      authStore.profileDecoration = [];
      await fetchDecorations();
      await authStore.fetchDecorationByUserId(2);
      selectedDecoration.value = authStore.userInfo?.profileEffectId ?? null;
    } else {
      selectedDecoration.value = null;
      offset.value = 0;
      limit.value = 20;
      isLoading.value = false;
      isLoadingMore.value = false;
      isApplying.value = false;

      closeModal();
    }
  }
);

async function loadMoreDecorations() {
  isLoadingMore.value = true;
  offset.value += limit.value;
  try {
    await authStore.fetchProfileDecorations(offset.value, limit.value);
    isLoadingMore.value = false;
  } catch (error) {
    console.error("Error loading more profile decorations:", error);
  } finally {
    isLoadingMore.value = false;
  }
}

const handlePurchaseSuccess = async () => {
  showModalSuccess.value = true;
  isOpenModalPayment.value = false;

  try {
    await authStore.fetchDecorationByUserId(2);
  } catch (error) {
    console.error("Failed to refresh user decorations after purchase:", error);
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-3xl">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-palette" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Trang trí Profile</h3>
      </div>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-primary"
        />
        <span class="ml-2">Đang tải trang trí profile...</span>
      </div>
      <div
        v-else
        :class="isMobile ? 'flex flex-col gap-6' : 'flex gap-6'"
        class="max-h-96 overflow-y-auto scrollbar-hide"
      >
        <div v-if="isMobile" class="w-80">
          <div class="p-6 rounded-lg">
            <h4 class="text-sm font-medium mb-4 text-center">
              Xem trước Profile
            </h4>
            <div class="flex flex-col items-center space-y-4">
              <!-- Profile Card Preview -->
              <div
                class="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative"
              >
                <!-- Profile Effect Overlay for entire card -->
                <div
                  v-if="selectedDecorationItem?.metadata?.effects"
                  class="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-lg overflow-hidden"
                  :style="selectedDecorationAnimationStyle"
                ></div>

                <!-- Banner Section -->
                <div
                  class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative"
                >
                  <div class="absolute inset-0 bg-black opacity-10"></div>
                  <img
                    v-if="authStore.user?.banner"
                    :src="authStore.user.banner"
                    alt="Banner"
                    class="w-full h-full object-cover"
                  />
                </div>

                <!-- Avatar Section -->
                <div class="relative px-6 pb-6">
                  <div class="flex items-start -mt-12 mb-4">
                    <!-- Avatar Container -->
                    <div
                      class="relative w-20 h-20 flex items-center justify-center"
                    >
                      <!-- Avatar -->
                      <div
                        class="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-700"
                      >
                        <img
                          v-if="authStore.user?.avatar"
                          :src="authStore.user.avatar"
                          :alt="authStore.user?.globalName || 'Avatar'"
                          class="w-full h-full object-cover"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-user"
                          class="w-8 h-8 text-gray-500 dark:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Profile Info -->
                  <div class="space-y-3">
                    <div>
                      <h2
                        class="text-xl font-bold text-gray-900 dark:text-white"
                      >
                        {{ authStore.user?.globalName || "Display Name" }}
                      </h2>
                      <p class="text-gray-600 dark:text-gray-400 text-sm">
                        @{{ authStore.user?.username || "username" }}
                      </p>
                    </div>

                    <!-- Biography -->
                    <div class="pt-2">
                      <p
                        class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                      >
                        {{
                          authStore.user?.bio ||
                          "Your biography will appear here. Add some details about yourself to make your profile more interesting!"
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Options Section -->
        <div class="flex-1 space-y-6">
          <!-- Profile Effects Selection -->
          <div>
            <label class="block text-sm font-medium mb-2"
              >Hiệu ứng Profile</label
            >
            <div
              :class="
                isMobile ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-4 gap-2'
              "
            >
              <UTooltip
                v-for="decoration in decorationOptions"
                :key="decoration.value || 'none'"
                :text="
                  decoration.owned
                    ? decoration.label
                    : `${decoration.label} (Chưa sở hữu)`
                "
              >
                <UCard
                  :class="[
                    'cursor-pointer transition-all aspect-square flex items-center justify-center relative',
                    selectedDecoration === decoration.value
                      ? 'ring-2 ring-primary'
                      : 'hover:ring-1 hover:ring-gray-300',
                    !decoration.owned && decoration.price !== 0
                      ? 'opacity-50'
                      : '',
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
                      class="w-18 h-18 rounded-xl object-cover"
                    />
                    <div
                      v-else
                      class="w-8 h-8 border-2 border-gray-300 rounded-full"
                    ></div>
                  </div>

                  <UIcon
                    v-if="!decoration.owned && decoration.price !== 0"
                    name="i-lucide-lock"
                    class="absolute top-2 right-2 text-gray-400 w-4 h-4"
                  />
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

        <!-- Profile Preview Section -->
        <div v-if="!isMobile" class="w-80 sticky top-0 self-start">
          <div class="p-6 rounded-lg">
            <h4 class="text-sm font-medium mb-4 text-center">
              Xem trước Profile
            </h4>
            <div class="flex flex-col items-center space-y-4">
              <!-- Profile Card Preview -->
              <div
                class="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative"
              >
                <!-- Profile Effect Overlay for entire card -->
                <div
                  v-if="selectedDecorationItem?.metadata?.effects"
                  class="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-lg overflow-hidden"
                  :style="selectedDecorationAnimationStyle"
                ></div>

                <!-- Banner Section -->
                <div
                  class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative"
                >
                  <div class="absolute inset-0 bg-black opacity-10"></div>
                  <img
                    v-if="authStore.user?.banner"
                    :src="authStore.user.banner"
                    alt="Banner"
                    class="w-full h-full object-cover"
                  />
                </div>

                <!-- Avatar Section -->
                <div class="relative px-6 pb-6">
                  <div class="flex items-start -mt-12 mb-4">
                    <!-- Avatar Container -->
                    <div
                      class="relative w-20 h-20 flex items-center justify-center"
                    >
                      <!-- Avatar -->
                      <div
                        class="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-700"
                      >
                        <img
                          v-if="authStore.user?.avatar"
                          :src="authStore.user.avatar"
                          :alt="authStore.user?.globalName || 'Avatar'"
                          class="w-full h-full object-cover"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-user"
                          class="w-8 h-8 text-gray-500 dark:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Profile Info -->
                  <div class="space-y-3">
                    <div>
                      <h2
                        class="text-xl font-bold text-gray-900 dark:text-white"
                      >
                        {{ authStore.user?.globalName || "Display Name" }}
                      </h2>
                      <p class="text-gray-600 dark:text-gray-400 text-sm">
                        @{{ authStore.user?.username || "username" }}
                      </p>
                    </div>

                    <!-- Biography -->
                    <div class="pt-2">
                      <p
                        class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                      >
                        {{
                          authStore.user?.bio ||
                          "Your biography will appear here. Add some details about yourself to make your profile more interesting!"
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="
                  selectedDecorationItem &&
                  !selectedDecorationItem.owned &&
                  selectedDecorationItem.price !== 0 &&
                  selectedDecorationItem.value
                "
                class="mt-4 flex flex-col items-center space-y-2"
              >
                <p class="text-sm text-gray-500">
                  Hiệu ứng này chưa được sở hữu.
                </p>
                <p class="text-base font-medium text-primary">
                  Giá:

                  <span>{{ selectedDecorationItem.price }} VND</span>
                </p>
                <UButton
                  color="primary"
                  icon="i-lucide-shopping-cart"
                  @click="isOpenModalPayment = true"
                >
                  Mua ngay
                </UButton>
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
          @click="closeModal()"
          :disabled="isApplying"
        >
          Hủy
        </UButton>
        <UButton
          color="primary"
          @click="applyDecoration"
          :loading="isApplying"
          :disabled="
            !selectedDecorationItem ||
            (!selectedDecorationItem.owned &&
              selectedDecorationItem.price !== 0) ||
            isApplying
          "
        >
          Áp dụng
        </UButton>
      </div>
    </template>
  </UModal>

  <OrganismsModalPayment
    v-model:show="isOpenModalPayment"
    :amount="selectedDecorationItem?.price || 0"
    :content="`Mua profile effect ${selectedDecorationItem?.label || ''}`"
    avatar
    effect
    :avatar-effect-id="selectedDecorationItem?.id || undefined"
    @close="isOpenModalPayment = false"
    @success="handlePurchaseSuccess"
  />

  <OrganismsModalSuccess v-model:show="showModalSuccess" />
</template>
