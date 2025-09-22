<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-full opacity-0"
    >
      <div
        v-if="show"
        class="fixed z-50 bg-gray-800 text-white rounded-lg shadow-xl px-4 py-3"
        :class="[
          isMobile
            ? 'inset-x-4 bottom-[84px] max-w-[calc(100vw-2rem)]'
            : 'left-1/2 transform -translate-x-1/2 bottom-4 min-w-[500px]',
        ]"
        style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      >
        <div
          class="flex items-center justify-between"
          :class="{ 'flex-col gap-3': isMobile }"
        >
          <span
            class="text-sm font-medium"
            :class="{ 'text-center': isMobile }"
            >{{ title }}</span
          >

          <div class="flex items-center gap-x-3">
            <button
              @click="$emit('reset')"
              class="text-sm text-gray-300 hover:text-white underline"
            >
              {{ resetLabel }}
            </button>
            <button
              @click="$emit('save')"
              class="text-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white font-medium"
            >
              {{ saveLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useBreakpoint } from "~/composables/useBreakpoint.client";

const { isMobile } = useBreakpoint();
interface Props {
  show?: boolean;
  title?: string;
  saveLabel?: string;
  resetLabel?: string;
}

const {
  show = false,
  title = "Careful — you have unsaved changes!",
  saveLabel = "Lưu Thay Đổi",
  resetLabel = "Đặt lại",
} = defineProps<Props>();

defineEmits<{
  save: [];
  reset: [];
}>();
</script>
