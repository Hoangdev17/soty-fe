<template>
  <UModal v-model:open="isOpen" title="Mời bạn bè tham gia">
    <template #content
      ><div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Mời bạn bè tham gia
          </h3>
          <UButton
            icon="i-heroicons-x-mark-20-solid"
            variant="ghost"
            size="sm"
            @click="closeModal"
          />
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Chia sẻ liên kết mời này để mời bạn bè tham gia cộng đồng của bạn.
          </p>

          <div class="flex gap-2">
            <UInput
              v-model="displayLink"
              readonly
              class="flex-1"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  icon="i-heroicons-clipboard-document-20-solid"
                  variant="ghost"
                  size="sm"
                  @click="copyToClipboard"
                  :loading="isCopying"
                >
                  {{ isCopying ? "Đang sao chép..." : "Sao chép" }}
                </UButton>
              </template>
            </UInput>
          </div>

          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="closeModal"> Đóng </UButton>
          </div>
        </div>
      </div></template
    >
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  open?: boolean;
  guildId?: string;
  guildUsername?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  guildId: "",
  guildUsername: "",
});

const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const isCopying = ref(false);

// Generate invite link based on guild info
const inviteLink = computed(() => {
  if (props.guildId && props.guildUsername) {
    return `${window.location.origin}/community/introduce/${props.guildId}`;
  }
  return "";
});

// Truncate long URLs for display
const displayLink = computed(() => {
  const link = inviteLink.value;
  if (link.length > 50) {
    return link.substring(0, 47) + "...";
  }
  return link;
});

const closeModal = () => {
  isOpen.value = false;
};

const copyToClipboard = async () => {
  if (!inviteLink.value) return;

  try {
    isCopying.value = true;
    await navigator.clipboard.writeText(inviteLink.value);

    // Show success toast notification
    const toast = useToast();
    toast.add({
      title: "Thành công!",
      description: "Đã sao chép liên kết mời vào clipboard",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (error) {
    console.error("Failed to copy:", error);
    // Show error toast notification
    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: "Không thể sao chép liên kết. Vui lòng sao chép thủ công.",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    isCopying.value = false;
  }
};
</script>
