<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useProjectStore } from "~/stores/project/project.store";
import { useRoute } from "vue-router";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const projectStore = useProjectStore();
const { projects, projectCount } = storeToRefs(projectStore);
const route = useRoute();

const guildId = route.params.guild_id as string;
const isSubmit = ref(false);

const state = ref({
  name: "",
  description: "",
});

async function handleCreateProject() {
  if (!state.value.name.trim()) return;
  isSubmit.value = true;
  try {
    await projectStore.createProject(guildId, state.value);

    // Reset form
    state.value.name = "";
    state.value.description = "";

    // Đóng modal
    emit("update:modelValue", false);
  } finally {
    isSubmit.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="props.modelValue"
    @close="emit('update:modelValue', false)"
  >
    <!-- Header -->
    <template #header>
      <h3 class="text-lg font-semibold text-center w-full">Tạo Project Mới</h3>
    </template>

    <!-- Body -->
    <template #body>
      <UFormField label="Tên Project" required class="mt-3">
        <UInput
          placeholder="Nhập tên project"
          v-model="state.name"
          :disabled="isSubmit"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mô tả" class="mt-3">
        <UInput
          placeholder="Nhập mô tả (tùy chọn)"
          v-model="state.description"
          :disabled="isSubmit"
          class="w-full"
        />
      </UFormField>
    </template>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          @click="emit('update:modelValue', false)"
          :disabled="isSubmit"
        >
          Hủy
        </UButton>
        <UButton
          :loading="isSubmit"
          @click="handleCreateProject"
          color="primary"
        >
          Tạo Project
        </UButton>
      </div>
    </template>
  </UModal>
</template>
