<template>
  <button
    @click="toggle"
    :aria-pressed="theme === 'dark'"
    class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200/5"
    title="Toggle theme"
  >
    <svg
      v-if="theme === 'dark'"
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 text-yellow-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 text-gray-100"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20.354 15.354A9 9 0 118.646 3.646 7 7 0 0020.354 15.354z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
const { theme, toggle } = useTheme();
</script>
