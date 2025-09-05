<script setup lang="ts">
import HomeDefautLayout from "~/components/organisms/home.defaut.layout.vue";
</script>

<template>
  <div class="min-h-screen flex bg-[var(--ui-bg)]">
    <!-- Sidebar -->
    <aside
      class="w-[80px] border-r border-[var(--ui-border)] h-screen overflow-y-auto"
    >
      <HomeDefautLayout />
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-y-auto">
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
