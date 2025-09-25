<script setup lang="ts">
const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["update:show"]);
</script>

<template>
  <UModal
    :open="props.show"
    title="Thành công"
    @close="emit('update:show', false)"
    @update:open="emit('update:show', $event)"
  >
    <template #body>
      <div class="p-6 flex flex-col items-center justify-center space-y-4">
        <div class="text-green-500">
          <svg
            class="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Thanh toán thành công!
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-center">
          Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.
        </p>
        <UButton
          variant="solid"
          color="primary"
          @click="emit('update:show', false)"
        >
          Đóng
        </UButton>
      </div>
    </template>
  </UModal>
</template>
