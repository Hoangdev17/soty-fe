<template>
  <UContainer class="relative z-10">
    <nav class="flex items-center justify-between py-6">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center"
        >
          <Icon
            name="i-heroicons-chat-bubble-left-ellipsis"
            class="w-6 h-6 text-white"
          />
        </div>
        <span class="text-2xl font-bold text-white">Soty</span>
      </div>

      <!-- Menu Links -->
      <div class="hidden md:flex items-center gap-8">
        <ULink
          v-for="link in links"
          :key="link"
          class="text-white hover:text-purple-200 transition-colors font-medium"
        >
          {{ link }}
        </ULink>
      </div>

      <!-- Desktop Button -->
      <UButton
        variant="solid"
        color="neutral"
        size="xl"
        class="hidden md:block rounded-xl"
      >
        Open Soty
      </UButton>

      <!-- Mobile Menu Button -->
      <UButton variant="ghost" color="white" size="sm" class="md:hidden">
        <Icon name="i-heroicons-bars-3" class="w-6 h-6" />
      </UButton>
    </nav>
  </UContainer>
</template>

<script setup lang="ts">
// danh sách links
const links = ["Download", "Nitro", "Discover", "Safety", "Support"];
</script>
