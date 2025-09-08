<template>
  <div class="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
    <div class="text-center">
      <div
        class="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse"
      >
        <Icon
          name="i-heroicons-chat-bubble-left-ellipsis"
          class="w-8 h-8 text-white"
        />
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Soty</h2>
      <p class="text-gray-400">{{ message }}</p>
      <div class="mt-4">
        <div class="w-32 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-loading-bar"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
}

const { message = "Đang khởi tạo..." } = defineProps<Props>();
</script>

<style scoped>
@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-loading-bar {
  animation: loading-bar 1.5s ease-in-out infinite;
}
</style>
