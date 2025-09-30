<script setup lang="ts">
import { useBreakpoint } from "~/composables/useBreakpoint.client";
import { computed, ref, watchEffect } from "vue";

const props = defineProps<{
  channel?: any;
}>();

const emit = defineEmits<{ (e: "delete"): void }>();

const { isMobile } = useBreakpoint();

const route = useRoute();
const section = ref<string | undefined>(undefined);

watchEffect(() => {
  const pathSegments = route.path.split("/").filter(Boolean);
  if (pathSegments.length > 6) {
    section.value = pathSegments[pathSegments.length - 1] || "overview";
  } else {
    section.value = "overview";
  }
});

type MenuItem = {
  label: string;
  icon?: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  class?: string;
  onSelect?: () => void;
};

const currentChannel = computed(() => props.channel);

const menuItems = computed<MenuItem[]>(() => [
  {
    label: "Overview",
    icon: "i-lucide-hash",
    to: route.path.replace(/\/settings.*$/, "/settings"),
    active: section.value === "overview",
  },
  {
    label: "Permissions",
    icon: "i-lucide-shield",
    to: `${route.path.replace(/\/settings.*$/, "/settings")}/permissions`,
    active: section.value === "permissions",
    disabled: true,
  },
  {
    label: "Integrations",
    icon: "i-lucide-plug",
    to: `${route.path.replace(/\/settings.*$/, "/settings")}/integrations`,
    active: section.value === "integrations",
    disabled: true,
  },
  {
    label: "Delete Channel",
    icon: "i-lucide-trash-2",
    onSelect: () => emit("delete"),
    class: "text-red-400 hover:text-red-300",
  },
]);
</script>

<template>
  <div
    v-if="!isMobile"
    class="sticky top-0 flex flex-col min-h-screen h-screen w-[200px] border-r border-dark-700 p-4 gap-4 bg-dark-800"
  >
    <div class="flex items-center gap-3 p-3 rounded-lg bg-dark-700">
      <div class="min-w-0 flex">
        <UIcon name="i-lucide-hash" class="w-6 h-6 text-gray-300" />
        <h3 class="font-semibold text-white truncate ml-2">
          {{ currentChannel?.name || "Channel" }}
        </h3>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
        v-for="(item, idx) in menuItems"
        :key="idx"
        class="flex items-center gap-2"
      >
        <template v-if="item.to">
          <UButton
            :to="item.to"
            :color="item.active ? 'primary' : 'neutral'"
            variant="ghost"
            :disabled="item.disabled"
            class="flex items-center gap-2 px-2 py-2 rounded-md w-full text-sm justify-start"
            :class="{
              'text-primary bg-primary-50 dark:bg-primary-950':
                item.active && !item.disabled,
              'hover:bg-dark-700 text-gray-300': !item.active && !item.disabled,
              'opacity-50 cursor-not-allowed text-gray-500': item.disabled,
            }"
          >
            <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </UButton>
        </template>
        <template v-else-if="item.onSelect">
          <UButton
            color="error"
            variant="ghost"
            :disabled="item.disabled"
            class="flex items-center gap-2 px-2 py-2 rounded-md w-full text-sm"
            :class="{
              'opacity-50 cursor-not-allowed': item.disabled,
              [item.class || '']: item.class,
            }"
            @click="item.onSelect"
          >
            <UIcon :name="item.icon ?? ''" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>
