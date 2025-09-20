<template>
  <UModal v-model:open="isOpen" class="max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-folder-plus" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Tạo danh mục mới</h3>
      </div>
    </template>

    <template #body>
      <form
        ref="categoryForm"
        @submit.prevent="createCategory"
        class="space-y-4"
      >
        <div>
          <label class="block text-sm font-medium mb-1">Tên danh mục *</label>
          <UInput
            v-model="newCategory.name"
            placeholder="Ví dụ: General, Gaming, Work"
            required
            :disabled="isCreating"
            class="w-full"
            maxlength="100"
          />
          <p class="text-xs text-gray-500 mt-1">
            Tên danh mục không được trùng với các danh mục khác
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Mô tả (tùy chọn)</label>
          <UTextarea
            v-model="newCategory.topic"
            placeholder="Mô tả ngắn về danh mục này..."
            :disabled="isCreating"
            class="w-full"
            maxlength="500"
            :rows="3"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ newCategory.topic?.length || 0 }}/500 ký tự
          </p>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          color="neutral"
          @click="closeModal"
          :disabled="isCreating"
        >
          Hủy
        </UButton>
        <UButton
          color="primary"
          @click="categoryForm?.requestSubmit()"
          :loading="isCreating"
          :disabled="!newCategory.name.trim()"
        >
          Tạo danh mục
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";

interface Props {
  open: boolean;
  guildId?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "created", category: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const communityStore = useCommunityStore();
const channelStore = useChannelStore();

// Form refs
const categoryForm = ref<HTMLFormElement>();

// State
const isCreating = ref(false);
const newCategory = ref({
  name: "",
  topic: "",
  position: -1 as number, // Default to end of list
});

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const positionOptions = computed(() => {
  const categories =
    channelStore.channels?.filter(
      (channel: any) => channel.type === "GUILD_CATEGORY"
    ) || [];

  const options = [{ label: "Đầu danh sách", value: 0 }];

  categories.forEach((category: any, index: number) => {
    options.push({
      label: `Sau "${category.name}"`,
      value: category.position + 1,
    });
  });

  options.push({
    label: "Cuối danh sách",
    value: -1, // Use -1 to represent "end of list"
  });

  return options;
});

// Methods
const createCategory = async () => {
  if (!newCategory.value.name.trim() || !props.guildId) return;

  isCreating.value = true;

  try {
    const categoryData = {
      name: newCategory.value.name.trim(),
      topic: newCategory.value.topic?.trim() || undefined,
      position: newCategory.value.position,
    };

    const createdCategory = await channelStore.createCategory({
      ...categoryData,
      guildId: props.guildId,
    });

    emit("created", createdCategory);
    closeModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: `Đã tạo danh mục "${newCategory.value.name}"`,
      color: "success",
    });
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Show error notification
    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể tạo danh mục. Vui lòng thử lại.",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

const closeModal = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  newCategory.value = {
    name: "",
    topic: "",
    position: -1,
  };
};

// Watch for modal close to reset form
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  }
);
</script>
