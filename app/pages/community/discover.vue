<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";

definePageMeta({
  layout: "main",
  middleware: [requiredAuth],
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Welcome to Test Layout Page!</h2>
    <p>This is the main content inside the test layout.</p>
  </div>
</template>
