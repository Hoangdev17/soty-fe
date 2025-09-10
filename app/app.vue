<template>
  <UApp>
    <!-- Auth Loading Screen - chỉ hiện khi thực sự cần -->
    <AppLoading v-if="showLoading" message="Đang xác thực người dùng..." />

    <!-- Main App - hiện ngay khi có cached data -->
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import AppLoading from "./components/atoms/AppLoading.vue";

const { isLoading, isInitialized } = useAuthGuard();

// Chỉ show loading khi chưa init hoặc đang loading và không có cached data
const showLoading = computed(() => {
  if (import.meta.server) return false;

  const hasCache =
    typeof window !== "undefined" &&
    (localStorage.getItem("userData") || localStorage.getItem("accessToken"));

  return (!isInitialized.value && !hasCache) || (isLoading.value && !hasCache);
});
</script>
