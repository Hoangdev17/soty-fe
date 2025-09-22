<script setup lang="ts">
import MenuNavigateNav from "../molecules/menu.navigate.nav.vue";
</script>

<template>
  <p class="strong mt-2">Các tin nhắn</p>
  <UButton
    icon="i-lucide-search"
    color="neutral"
    variant="outline"
    class="flex items-center justify-center w-full text-white mb-2 mt-2"
  >
    Search friend or any one
  </UButton>
  <USeparator color="neutral" />
  <MenuNavigateNav />
  <MoleculesFriendMessageList />
</template>
