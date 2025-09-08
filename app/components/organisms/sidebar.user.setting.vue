<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

const items = ref<TabsItem[]>([
  {
    label: "Tài khoản",
    icon: "i-lucide-user",
  },
  {
    label: "Bảo mật",
    icon: "i-lucide-lock",
  },
  {
    label: "Thông báo",
    icon: "i-lucide-bell",
  },
]);
</script>

<template>
  <div class="bg-gray-100 h-full py-6 px-2 border-r flex flex-col gap-2">
    <UTabs
      orientation="vertical"
      variant="pill"
      :content="false"
      :items="items"
      class="w-full"
      ui="tab:rounded-lg tab:px-4 tab:py-3 tab:gap-3 tab:text-base tab:font-medium tab:bg-white tab:shadow-sm"
    >
      <template #tab="{ item, selected }">
        <div
          class="flex items-center gap-3"
          :class="selected ? 'text-primary' : 'text-gray-700'"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </div>
      </template>
    </UTabs>
  </div>
</template>
