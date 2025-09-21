<script setup lang="ts">
import FloatingUserCard from "~/components/organisms/floating.user.card.vue";
import HomeDefautLayout from "~/components/organisms/sidebar.defaut.layout.vue";
import { initializeWebSocket } from "~/stores/websocket/websocket.action";

// Initialize WebSocket for @me routes and ensure persistent connection
onMounted(() => {
  initializeWebSocket();
});
</script>

<template>
  <div class="min-h-screen flex bg-[var(--ui-bg)]">
    <!-- Sidebar -->
    <aside class="w-[80px] h-screen flex flex-col relative">
      <div class="flex-1 overflow-y-auto">
        <HomeDefautLayout />
      </div>

      <!-- Floating card nằm ở bottom, không chiếm space main content -->
      <FloatingUserCard class="absolute bottom-2 left-2 right-2" />
    </aside>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Optional: hide scrollbar for sidebar */
aside::-webkit-scrollbar {
  display: none;
}
aside {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
