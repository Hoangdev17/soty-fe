<script setup lang="ts">
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

interface Props {
  buttonText?: string;
  icon?: string;
  color?: string;
  variant?: string;
  size?: string;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

interface Emits {
  (e: "success", url: string): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: "Upload",
  icon: "i-lucide-upload",
  color: "primary",
  variant: "outline",
  size: "md",
  disabled: false,
  accept: "image/*",
  maxSize: 5,
});

const emit = defineEmits<Emits>();

const { fetchWithAuth } = useFetchWithAuth();

// Reactive states
const uploadRef = ref();
const isUploading = ref(false);
const isModalOpen = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref<{ type: "success" | "error"; message: string } | null>(
  null
);
const selectedFile = ref<File | null>(null);

// Methods
const openModal = () => {
  if (props.disabled || isUploading.value) return;
  isModalOpen.value = true;
};

const closeModal = () => {
  if (isUploading.value) return;
  isModalOpen.value = false;
  uploadProgress.value = 0;
  uploadStatus.value = null;
};

const handleFileUpload = async () => {
  const file = selectedFile.value;
  if (!file) {
    console.log("❌ No file selected");
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = null;

  try {
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    const formData = new FormData();
    formData.append("file", file);

    const data = await fetchWithAuth<{ url: string }>("/uploads/image", {
      method: "POST",
      body: formData,
      isFormData: true,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    uploadStatus.value = {
      type: "success",
      message: "Tải lên thành công!",
    };

    // Đóng modal sau 1.5 giây
    setTimeout(() => {
      console.log("🎉 Emitting success event with URL:", data.url);
      emit("success", data.url);
      selectedFile.value = null;
      closeModal();
    }, 1500);
  } catch (error) {
    console.error("❌ Upload error:", error);
    uploadProgress.value = 0;
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";
    uploadStatus.value = {
      type: "error",
      message: `Tải lên thất bại: ${errorMessage}`,
    };
    emit("error", errorMessage);
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Upload Button -->
    <UButton
      :icon="icon"
      :color="color"
      :variant="variant"
      :size="size"
      :loading="isUploading"
      :disabled="disabled"
      @click="openModal"
      v-bind="$attrs"
    >
      <slot>{{ buttonText }}</slot>
    </UButton>

    <!-- Upload Modal -->
    <UModal v-model:open="isModalOpen" :prevent-close="isUploading">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon :name="icon" class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">
            {{ isUploading ? "Đang tải lên..." : "Chọn file để tải lên" }}
          </h3>
        </div>
      </template>

      <template #body>
        <div class="space-y-4 relative">
          <!-- Loading Overlay -->
          <div
            v-if="isUploading"
            class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg"
          >
            <div class="text-center space-y-3">
              <UIcon
                name="i-lucide-loader-2"
                class="w-8 h-8 animate-spin text-primary mx-auto"
              />
              <div class="space-y-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Đang tải lên file...
                </p>
                <UProgress
                  :value="uploadProgress"
                  color="primary"
                  class="w-48 mx-auto"
                />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ uploadProgress }}% hoàn thành
                </p>
              </div>
            </div>
          </div>

          <UFileUpload
            ref="uploadRef"
            v-model="selectedFile"
            :accept="accept"
            :max-size="maxSize * 1024 * 1024"
            :disabled="disabled || isUploading"
            @change="handleFileUpload"
            class="min-h-50"
          />

          <!-- Upload Status -->
          <div v-if="uploadStatus" class="text-center">
            <div
              :class="[
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                uploadStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
              ]"
            >
              <UIcon
                :name="
                  uploadStatus.type === 'success'
                    ? 'i-lucide-check-circle'
                    : 'i-lucide-x-circle'
                "
                class="w-4 h-4"
              />
              {{ uploadStatus.message }}
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="outline"
            color="gray"
            @click="closeModal"
            :disabled="isUploading"
          >
            {{ isUploading ? "Đang tải lên..." : "Hủy" }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
