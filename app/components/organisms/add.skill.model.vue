<script setup lang="ts">
import { useBotStore } from "~/stores/bots/bot.store";
import type { Bot } from "~/stores/bots/bot.type";

const props = defineProps<{
  selectedBot: Bot | null;
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const createSkillForm = ref({
  name: "",
  description: "",
  model: "",
});

const isCreating = ref(false);
const toast = useToast();
const botStore = useBotStore();

const resetForm = () => {
  createSkillForm.value = {
    name: "",
    description: "",
    model: "",
  };
};

const handleClose = () => {
  emit("update:open", false);
  resetForm();
};

const handleAddSkill = async () => {
  if (!props.selectedBot) return;

  try {
    isCreating.value = true;

    if (!createSkillForm.value.name) {
      toast.add({
        title: "Lỗi!",
        description: "Vui lòng nhập tên skill",
        color: "error",
      });
      return;
    }

    await botStore.addSkillToBot(props.selectedBot.id, createSkillForm.value);

    toast.add({
      title: "Thành công!",
      description: `Đã thêm skill ${createSkillForm.value.name}`,
      color: "success",
    });

    await botStore.fetchAllBot(); // Refresh
    handleClose();
  } catch (error: any) {
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể thêm skill",
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
    title="Thêm Skill"
  >
    <template #content>
      <div class="p-6 space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tên Skill <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="createSkillForm.name"
            placeholder="Nhập tên skill"
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
            v-model="createSkillForm.description"
            placeholder="Mô tả về skill..."
            :rows="3"
            class="w-full"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Model
          </label>
          <UInput
            v-model="createSkillForm.model"
            placeholder="gpt-4, claude-3, etc."
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="ghost" @click="handleClose"> Hủy </UButton>
          <UButton :loading="isCreating" @click="handleAddSkill">
            Thêm Skill
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
