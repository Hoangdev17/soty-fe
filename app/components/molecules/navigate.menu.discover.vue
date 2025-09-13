<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Community",
      icon: "i-lucide-store",
      to: "/community/discover",
    },
    {
      label: "Friend",
      icon: "i-lucide-users",
      to: "/@me/channels",
    },

    {
      label: "Shop",
      icon: "i-lucide-store",
      to: "/shop",
    },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
    :ui="{
      item: {
        base: 'flex items-center gap-2 px-3 py-2 rounded-md transition',
        active: 'bg-neutral-800 text-white', // khi active
        inactive: 'text-neutral-400 hover:bg-neutral-700 hover:text-white',
      },
    }"
  />
  <USeparator class="mb-2" />
</template>
