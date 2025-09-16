<script setup lang="ts">
interface Props {
  message?: string;
}

const { message = "Đang khởi tạo..." } = defineProps<Props>();
</script>

<template>
  <div
    class="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4"
  >
    <div class="flex flex-col items-center">
      <!-- Spinner vòng tròn -->
      <div class="relative w-24 h-24 mb-4">
        <!-- Vòng tròn animation -->
        <div
          class="absolute inset-0 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"
        ></div>
        <!-- Logo ở giữa -->
        <img
          src="/logo.png"
          alt="Logo"
          class="w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
      </div>

      <!-- Message -->
      <p class="text-white text-center text-lg">{{ message }}</p>
    </div>
  </div>
</template>
