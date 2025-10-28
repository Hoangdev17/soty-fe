<script setup lang="ts">
import { useBotStore } from "~/stores/bots/bot.store";
import { TriggerType, type Bot } from "~/stores/bots/bot.type";

const props = defineProps<{
  selectedBot: Bot | null;
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const createCommandForm = ref({
  name: "",
  description: "",
  triggerType: TriggerType.PREFIX,
  pattern: "",
  skillId: "",
  actionId: "",
});

const isCreating = ref(false);
const toast = useToast();
const botStore = useBotStore();

const resetForm = () => {
  createCommandForm.value = {
    name: "",
    description: "",
    triggerType: TriggerType.PREFIX,
    pattern: "",
    skillId: "",
    actionId: "",
  };
};

const handleClose = () => {
  emit("update:open", false);
  resetForm();
};

const handleCreateCommand = async () => {
  if (!props.selectedBot) return;

  try {
    isCreating.value = true;

    if (!createCommandForm.value.name) {
      toast.add({
        title: "Lỗi!",
        description: "Vui lòng nhập tên command",
        color: "error",
      });
      return;
    }

    await botStore.addCommandToAction(
      props.selectedBot.id,
      createCommandForm.value
    );

    toast.add({
      title: "Thành công!",
      description: `Đã tạo command ${createCommandForm.value.name}`,
      color: "success",
    });

    await botStore.fetchAllBot(); // Refresh
    handleClose();
  } catch (error: any) {
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể tạo command",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

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
    title="Tạo Command"
  >
    <template #content>
      <div class="p-6 space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tên Command <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="createCommandForm.name"
            placeholder="Nhập tên command"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Mô tả
          </label>
          <UTextarea
            v-model="createCommandForm.description"
            placeholder="Mô tả về command..."
            :rows="2"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Pattern
          </label>
          <UInput
            v-model="createCommandForm.pattern"
            placeholder="^/help$, ^!ping, etc."
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Trigger Type <span class="text-red-500">*</span>
          </label>
          <USelect
            v-model="createCommandForm.triggerType"
            :items="[
              { label: 'PREFIX', value: TriggerType.PREFIX },
              { label: 'EXACT', value: TriggerType.EXACT },
              { label: 'PATTERN', value: TriggerType.PATTERN },
            ]"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Skill
          </label>
          <USelect
            v-model="createCommandForm.skillId"
            :items="
              selectedBot?.BotSkill?.map((s) => ({
                label: s.name,
                value: s.id,
              })) || []
            "
            placeholder="Chọn skill (optional)"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Action
          </label>
          <USelect
            v-model="createCommandForm.actionId"
            :items="
              selectedBot?.BotAction?.map((a) => ({
                label: a.name,
                value: a.id,
              })) || []
            "
            placeholder="Chọn action (optional)"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="ghost" @click="handleClose"> Hủy </UButton>
          <UButton :loading="isCreating" @click="handleCreateCommand">
            Tạo Command
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
