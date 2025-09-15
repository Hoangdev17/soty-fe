<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { ref } from "vue";
import { useCommunityStore } from "~/stores/community/community.store";

definePageMeta({
  layout: "main",
  middleware: ["required-auth"],
});

// DÙng field 'value' để UTabs map với v-model test
const items = ref<TabsItem[]>([
  { label: "Trực tuyến", value: "online" },
  { label: "Tất cả", value: "all" },
  { label: "Đang chờ xử lý", value: "pending" },
  { label: "Thêm bạn", value: "add" },
]);

const isOpenSlideover = ref(false);
// Khởi tạo selected từ items[0].value cho chắc
const selected = ref(items?.value[0]?.value);
</script>

<template>
  <div class="flex min-h-screen w-full bg-[var(--ui-bg)]">
    <!-- Sidebar trái -->
    <div class="flex flex-col sticky top-0 h-screen min-w-[210px] md:p-4 gap-4">
      <OrganismsSidebarDmMessage class="flex-1 w-full" />
    </div>

    <!-- Separator vertical -->
    <USeparator orientation="vertical" class="h-screen" />

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-y-auto flex gap-4 overflow-x-hidden">
      <!-- Nội dung chính -->
      <div class="flex-1 min-w-0">
        <!-- <-- min-w-0 cho flex child để co đúng -->
        <!-- Header row -->
        <div class="flex items-center justify-between mb-4">
          <!-- Label -->
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="w-5 h-5" />
            <span class="text-base font-medium">Bạn bè</span>
          </div>

          <!-- Tabs -->
          <UTabs
            v-model="selected"
            :items="items"
            color="neutral"
            variant="link"
            size="lg"
            class="flex-1 mx-8"
          />

          <!-- Nút mở panel -->
          <UButton
            icon="i-lucide-user-plus"
            variant="ghost"
            color="neutral"
            @click="isOpenSlideover = !isOpenSlideover"
          />
        </div>

        <!-- === Nội dung theo tab (RA NGOÀI header) === -->
        <div class="mt-4">
          <div v-if="selected === 'online'">
            Online component (hiện nội dung cho tab Trực tuyến)
          </div>
          <div v-else-if="selected === 'all'">
            All component (nội dung Tất cả)
          </div>
          <div v-else-if="selected === 'pending'">
            Pending component (nội dung Đang chờ xử lý)
          </div>
          <div v-else-if="selected === 'add'">
            Add component (form Thêm bạn)
          </div>
        </div>
      </div>

      <!-- Panel bên phải (Slideover thay thế) -->
      <Transition name="slide">
        <div
          v-if="isOpenSlideover"
          class="w-[320px] shrink-0 border-l border-neutral-200 bg-[var(--ui-bg)] p-4"
        >
          <h3 class="font-semibold mb-3">Thêm bạn bè</h3>
          <UInput placeholder="Nhập tên bạn bè" class="mb-3" />
          <UButton label="Thêm" color="neutral" block />
        </div>
      </Transition>
    </main>
  </div>
</template>
