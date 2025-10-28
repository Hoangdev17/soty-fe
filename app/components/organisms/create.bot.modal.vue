<script setup lang="ts">
import { useBotStore } from "~/stores/bots/bot.store";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const createBotForm = ref({
  username: "",
  email: "",
  bio: "",
  avatar: "",
});
const isCreating = ref(false);
const toast = useToast();
const botStore = useBotStore();

const resetForm = () => {
  createBotForm.value = {
    username: "",
    email: "",
    bio: "",
    avatar: "",
  };
};

const handleClose = () => {
  emit("update:open", false);
  resetForm();
};

const handleCreateBot = async () => {
  try {
    isCreating.value = true;

    if (!createBotForm.value.username || !createBotForm.value.email) {
      toast.add({
        title: "Lỗi!",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        color: "error",
      });
      return;
    }

    await botStore.createBot(createBotForm.value);

    toast.add({
      title: "Thành công!",
      description: `Đã tạo bot ${createBotForm.value.username}`,
      color: "success",
    });

    handleClose();
  } catch (error: any) {
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể tạo bot",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

async function handleUploadSuccess(url: string) {
  createBotForm.value.avatar = url;
}

watch(
  () => props.open,
  (newValue) => {
    if (!newValue) {
      resetForm();
    }
  }
);
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
    title="Tạo Bot Mới"
  >
    <template #content>
      <div class="p-6 space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="createBotForm.username"
            placeholder="Nhập tên bot"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="createBotForm.email"
            type="email"
            placeholder="bot@example.com"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Bio
          </label>
          <UTextarea
            v-model="createBotForm.bio"
            placeholder="Mô tả về bot..."
            :rows="3"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Avatar URL
          </label>
          <MoleculesUploadButton @success="handleUploadSuccess" />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="ghost" @click="handleClose"> Hủy </UButton>
          <UButton :loading="isCreating" @click="handleCreateBot">
            Tạo Bot
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
