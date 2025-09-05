<script setup lang="ts">
definePageMeta({
  layout: "main",
});
</script>

<template>
  <div class="flex h-screen">
    <!-- Cột 3 phần -->
    <div class="flex-[3] bg-blue-200 p-4">Sidebar hoặc cột nhỏ</div>

    <!-- Cột 6 phần -->
    <div class="flex-[7] bg-green-200 p-4">Nội dung chính</div>
  </div>
</template>
