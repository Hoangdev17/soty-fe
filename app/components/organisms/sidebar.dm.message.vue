<script setup lang="ts">
import MenuNavigateNav from "../molecules/menu.navigate.nav.vue";
</script>

<template>
  <UButton
    icon="i-lucide-search"
    color="neutral"
    variant="outline"
    class="flex items-center justify-center w-full text-white mb-1"
  >
    Search friend or any one
  </UButton>
  <USeparator color="neutral" />
  <MenuNavigateNav />
  <MoleculesFriendMessageList />
</template>
