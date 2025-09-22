<script setup lang="ts">
import { useBreakpoint } from "~/composables/useBreakpoint.client";
import MobileCommunitySettingsNav from "~/components/molecules/mobile.community.settings.nav.vue";

interface Props {
  currentSection?: string;
  title?: string;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentSection: "overview",
  title: "Settings",
  showCloseButton: true,
  closeOnEsc: true,
});

const { isMobile } = useBreakpoint();
const router = useRouter();
const route = useRoute();

const closeSettings = () => {
  const guildId = route.params.guild_id as string;
  router.push(`/community/introduce/${guildId}`);
};

// Keyboard shortcut ESC to close
onMounted(() => {
  if (!props.closeOnEsc) return;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeSettings();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });
});
</script>

<template>
  <div v-if="isMobile" class="min-h-screen bg-dark-900 flex flex-col">
    <!-- Mobile Header -->
    <div
      class="sticky top-0 z-50 bg-dark-900 border-b border-dark-700 px-4 py-3"
      style="background-color: rgb(15, 15, 15)"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-white">{{ props.title }}</h1>
        <UButton
          v-if="props.showCloseButton"
          @click="closeSettings"
          variant="ghost"
          size="sm"
          class="w-8 h-8 rounded-full flex items-center justify-center"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5 text-gray-400" />
        </UButton>
      </div>
    </div>

    <!-- Mobile Content -->
    <div class="flex-1 overflow-y-auto pb-16 bg-dark-900">
      <div class="p-4">
        <slot />
      </div>
    </div>

    <!-- Mobile Navigation -->
    <MobileCommunitySettingsNav :current-section="props.currentSection" />
  </div>

  <!-- Desktop Layout -->
  <div v-else class="flex items-start size-full bg-dark-900">
    <slot name="desktop" />
  </div>
</template>
