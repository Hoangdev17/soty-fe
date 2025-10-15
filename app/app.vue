<script setup lang="ts">
import AppLoading from "~/components/atoms/app.loading.vue";
import { useAuthStore } from "~/stores/auth/auth.store";

const authStore = useAuthStore();
const showLoading = ref(true);

// Tạo message giới thiệu nền tảng
const loadingMessage =
  "Chào mừng bạn đến với Soty – nơi kết nối cộng đồng và học hỏi cùng nhau!";

onMounted(() => {
  if (import.meta.server) return;
  handleMounted();
});

async function handleMounted() {
  const route = useRoute();

  showLoading.value =
    route.path !== "/" &&
    route.path !== "/auth/login" &&
    route.path !== "/auth/register" &&
    route.path !== "/auth/forgot-password";

  if (!authStore.isInitialized) {
    await authStore.initializeAuth();
  }
  showLoading.value = false;
}
</script>

<template>
  <UApp>
    <AppLoading v-if="showLoading" :message="loadingMessage" />
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
