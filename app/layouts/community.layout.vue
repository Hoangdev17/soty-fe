<script setup lang="ts">
import SidebarDefaultLayout from "~/components/organisms/sidebar.defaut.layout.vue";
import SidebarCommunity from "~/components/organisms/sidebar.community.vue";
import FloatingUserCard from "~/components/organisms/floating.user.card.vue";
import { initializeWebSocket } from "../stores/websocket/websocket.action";

onMounted(() => {
  initializeWebSocket();
});
</script>

<template>
  <div class="min-h-screen flex bg-[var(--ui-bg)] h-screen overflow-hidden">
    <!-- Server List Sidebar -->
    <aside class="w-[80px] h-screen flex flex-col relative">
      <div class="flex-1 overflow-y-auto">
        <SidebarDefaultLayout />
      </div>
      <FloatingUserCard class="absolute bottom-2 left-2 right-2" />
    </aside>

    <!-- Main Community Content -->
    <div class="flex flex-1 h-screen">
      <!-- Channel Sidebar -->
      <div class="w-60 h-screen">
        <SidebarCommunity />
      </div>

      <USeparator orientation="vertical" class="h-screen" />

      <!-- Messages Area -->
      <main class="flex-1 bg-dark-800 h-screen overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
