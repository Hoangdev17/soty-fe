<script setup lang="ts">
import { useBotStore } from "~/stores/bots/bot.store";
import type { Bot, BotSkill } from "~/stores/bots/bot.type";

const props = defineProps<{
  selectedBot: Bot | null;
  selectedSkill: BotSkill | null;
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const createActionForm = ref({
  name: "",
  handler: "",
  paramsSchema: null as any,
});

const isCreating = ref(false);
const toast = useToast();
const botStore = useBotStore();

// Handlers list from store
const handlers = computed(() => botStore.handlers);

const resetForm = () => {
  createActionForm.value = {
    name: "",
    handler: "",
    paramsSchema: null,
  };
};

const handleClose = () => {
  emit("update:open", false);
  resetForm();
};

const handleCreateAction = async () => {
  if (!props.selectedBot || !props.selectedSkill) return;

  try {
    isCreating.value = true;

    if (!createActionForm.value.name) {
      toast.add({
        title: "Lỗi!",
        description: "Vui lòng nhập tên action",
        color: "error",
      });
      return;
    }

    await botStore.addActionToBot(
      props.selectedBot.id,
      createActionForm.value,
      props.selectedSkill.id
    );

    toast.add({
      title: "Thành công!",
      description: `Đã tạo action ${createActionForm.value.name}`,
      color: "success",
    });

    await botStore.fetchAllBot(); // Refresh
    handleClose();
  } catch (error: any) {
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể tạo action",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

watch(
  () => props.open,
  async (newValue) => {
    if (newValue && props.selectedBot) {
      // Fetch handlers when modal opens with botId
      await botStore.fetchBotHandlers(props.selectedBot.id);
    } else if (!newValue) {
      resetForm();
    }
  }
);
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
    title="Tạo Action"
  >
    <template #content>
      <div class="p-6 space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tên Action <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="createActionForm.name"
            placeholder="Nhập tên action"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Handler
          </label>
          <USelect
            v-model="createActionForm.handler"
            :items="handlers"
            placeholder="Chọn handler"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="ghost" @click="handleClose"> Hủy </UButton>
          <UButton :loading="isCreating" @click="handleCreateAction">
            Tạo Action
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
