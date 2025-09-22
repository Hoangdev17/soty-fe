<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";

interface Props {
  currentSection?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentSection: "overview",
});

const communityStore = useCommunityStore();
const currentCommunity = computed(() => communityStore.currentCommunity);

const menuItems = computed(() => [
  {
    label: "Overview",
    icon: "i-lucide-home",
    to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings`,
    section: "overview",
  },
  {
    label: "Roles",
    icon: "i-lucide-shield",
    to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/roles`,
    section: "roles",
  },
  {
    label: "Members",
    icon: "i-lucide-users",
    to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/members`,
    section: "members",
  },
  {
    label: "General",
    icon: "i-lucide-settings",
    to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/general`,
    section: "general",
  },
  {
    label: "Channels",
    icon: "i-lucide-hash",
    to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/channels`,
    section: "channels",
  },
]);
</script>

<template>
  <div
    class="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 z-60"
    style="background-color: rgb(15, 15, 15)"
  >
    <div class="flex justify-around py-2 px-1 overflow-x-auto">
      <UButton
        v-for="item in menuItems"
        :key="item.section"
        variant="ghost"
        color="neutral"
        size="sm"
        :to="item.to"
        class="flex flex-col items-center gap-1 min-w-0 flex-shrink-0 px-2 py-1"
        :class="{
          'text-primary':
            props.currentSection === item.section ||
            (!props.currentSection && item.section === 'overview'),
          'text-gray-400':
            props.currentSection !== item.section &&
            !(
              props.currentSection === 'overview' && item.section === 'overview'
            ),
        }"
      >
        <UIcon :name="item.icon" class="w-5 h-5" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </UButton>
    </div>
  </div>
</template>
