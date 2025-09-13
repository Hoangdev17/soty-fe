<script setup lang="ts">
import { ref } from "vue";
import { useCommunityStore } from "~/stores/community/community.store";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

const communityStore = useCommunityStore();
const toast = useToast();
const { fetchWithAuth } = useFetchWithAuth();

interface Props {
  modelValue?: File | null;
  size?: number;
  placeholderIcon?: string;
  accept?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  size: 64,
  placeholderIcon: "i-lucide-user",
  accept: "image/*",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: File | null];
  "file-selected": [file: File];
  "file-removed": [];
  created: [];
  uploaded: [url: string];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newFile) => {
    if (newFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(newFile);
    } else {
      previewUrl.value = null;
    }
  },
  { immediate: true }
);

const handleFileSelect = () => {
  if (!props.disabled) {
    fileInputRef.value?.click();
  }
};

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await fetchWithAuth<{ url: string }>("/uploads/image", {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      emit("uploaded", data.url);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.add({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        color: "error",
      });
    }
  }
};

const handleRemove = () => {
  emit("update:modelValue", null);
  emit("file-removed");
  previewUrl.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};
</script>

<template>
  <div class="circular-upload-button">
    <div
      :class="[
        'relative rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer overflow-hidden',
        { 'opacity-50 cursor-not-allowed': disabled },
      ]"
      :style="{ width: `${size}px`, height: `${size}px` }"
      @click="handleFileSelect"
    >
      <!-- Preview Image -->
      <UAvatar
        v-if="previewUrl"
        :src="previewUrl"
        :alt="placeholderIcon"
        class="w-full h-full object-cover"
      />

      <!-- Placeholder Icon -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <UIcon :name="placeholderIcon" class="w-8 h-8 text-gray-400" />
      </div>

      <!-- Remove Button -->
      <UButton
        v-if="previewUrl && !disabled"
        @click.stop="handleRemove"
        type="button"
      >
      </UButton>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      @change="handleFileChange"
      class="hidden"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
.circular-upload-button {
  display: inline-block;
}
</style>
