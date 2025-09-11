<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";
import { ref } from "vue";

const state = ref({
  isOpenModal: false,
  addedUsers: [] as any[],
  search: "",
  groupName: "",
  activeTab: "account", // default active tab
});
</script>

<template>
  <div class="max-w-xs h-full flex flex-col gap-2">
    <!-- Button mở modal -->
    <UButton
      color="neutral"
      variant="subtle"
      block
      @click="state.isOpenModal = true"
    >
      Thêm bạn bè
    </UButton>

    <!-- Modal thêm bạn -->
    <UModal v-model:open="state.isOpenModal" title="Thêm bạn bè">
      <template #body>
        <UInput v-model="state.search" placeholder="Search" class="w-full" />
        <div class="flex flex-col gap-2">
          <div
            v-for="user in state.addedUsers"
            :key="user.id"
            class="flex items-center justify-between cursor-pointer gap-2"
          >
            <span>{{ user.label }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <UInput
          v-if="state.addedUsers.length > 1"
          v-model="state.groupName"
          placeholder="Tên nhóm (không bắt buộc)"
          class="w-full"
        />
        <UButton
          :label="state.addedUsers.length > 2 ? 'Tạo nhóm DM' : 'Tạo DM'"
          color="neutral"
          class="w-full"
        />
      </template>
    </UModal>
  </div>
</template>
