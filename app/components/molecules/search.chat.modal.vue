<script lang="ts" setup>
const isOpenModal = ref(false);
</script>

<template>
  <UModal v-model:open="isOpenModal" title="Search">
    <UButton label="Search" color="neutral" variant="subtle" block />

    <template #body>
      <UInput
        placeholder="
          Search
        "
        size="xl"
        class="w-full"
        :ui="{
          base: 'h-20',
        }"
      />
    </template>
    <template #footer>
      <div class="flex items-center gap-x-2">
        <UButton
          label="Search"
          color="primary"
          variant="link"
          :ui="{
            label: 'font-bold text-xs uppercase text',
          }"
        />
        <span class="text-xs">Search</span>
        <UKbd variant="subtle" color="neutral">@</UKbd>
        <UKbd variant="subtle" color="neutral">#</UKbd>
        <UKbd variant="subtle" color="neutral">!</UKbd>
        <UKbd variant="subtle" color="neutral">*</UKbd>
        <span class="text-xs">Search</span>
      </div>
    </template>
  </UModal>
</template>
