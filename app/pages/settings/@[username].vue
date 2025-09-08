<script setup lang="ts">
useHead({
  title: "Tài khoản của tôi",
});

const itemsTab = ref([
  {
    label: "Profile",
    slot: "profile",
  },
  {
    label: "Security",
    slot: "security",
  },
]);
</script>

<template>
  <div class="w-full">
    <div class="flex">
      <div class="w-full pt-1">
        <p class="text-2xl font-bold">Account</p>
        <UTabs :items="itemsTab" variant="link" class="gap-4 mt-4">
          <template #profile> <OrganismsAccountPageProfileTab /> </template>

          <template #security> <OrganismsAccountPageSecurityTab /> </template>
        </UTabs>
      </div>
    </div>
  </div>
</template>
