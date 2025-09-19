<script setup lang="ts">
interface Props {
  modelValue: boolean;
  member: any;
  loading?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleConfirm = () => {
  emit("confirm");
};

const handleUpdateModelValue = (value: boolean) => {
  emit("update:modelValue", value);
};
</script>

<template>
  <UModal
    :open="props.modelValue"
    @update:open="handleUpdateModelValue"
    title="Ban Member"
    description="Are you sure you want to ban this member?"
  >
    <template #content>
      <UCard class="bg-dark-800 border-dark-700">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-5 h-5 text-red-500"
            />
            <h3 class="text-lg font-semibold text-white">Ban Member</h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-300">
            Are you sure you want to ban
            <span class="font-semibold text-white">
              {{ member?.user?.username }}
            </span>
            from this community?
          </p>
          <p class="text-sm text-red-400">
            This action cannot be undone. They will not be able to rejoin.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton @click="handleClose" variant="outline" color="neutral">
              Cancel
            </UButton>
            <UButton @click="handleConfirm" color="error" :loading="loading">
              Ban Member
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
