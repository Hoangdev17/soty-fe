<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";

definePageMeta({
  layout: "community-layout",
  middleware: [requiredAuth],
});
</script>

<template>
  <slot />
</template>
