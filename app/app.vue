<script setup lang="ts">
import AppLoading from "~/components/atoms/AppLoading.vue";
import { useAuthStore } from "~/stores/auth/auth.store";

const authStore = useAuthStore();
const showLoading = ref(true);

onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.initializeAuth();
  }
  showLoading.value = false;
});
</script>

<template>
  <UApp>
    <AppLoading v-if="showLoading" message="Đang xác thực người dùng..." />
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
