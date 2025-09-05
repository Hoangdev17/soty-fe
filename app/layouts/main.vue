<script setup lang="ts">
import FloatingUserCard from "~/components/organisms/floating.user.card.vue";
import HomeDefautLayout from "~/components/organisms/sidebar.defaut.layout.vue";
</script>

<template>
  <div class="min-h-screen flex bg-[var(--ui-bg)]">
    <!-- Sidebar -->
    <aside
      class="w-[80px] border-r border-white h-screen flex flex-col relative"
    >
      <div class="flex-1 overflow-y-auto pb-24">
        <HomeDefautLayout />
      </div>

      <!-- Floating card nằm ở bottom, không chiếm space main content -->
      <FloatingUserCard
        :user="{
          username: 'Hoàng Lưu',
          avatar: 'https://i.pravatar.cc/150?img=3',
          isOnline: true,
          status: 'Online',
        }"
        class="absolute bottom-2 left-2 right-2"
      />
    </aside>

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
