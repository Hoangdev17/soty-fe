<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";
import DeleteCommunityModal from "~/components/molecules/delete.community.modal.vue";

const communityStore = useCommunityStore();
const currentCommunity = computed(() => communityStore.currentCommunity);

const formData = reactive({
  name: "",
  description: "",
  avatar: "",
  banner: "",
});

type MenuItem = {
  label: string;
  icon?: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  class?: string;
  type?: string;
  onSelect?: () => void;
};

const route = useRoute();
const section = ref();

// Delete community modal
const isDeleteModalOpen = ref(false);

watchEffect(() => {
  const pathSegments = route.path.split("/").filter(Boolean);
  const path = route.path;

  // Check if we're in roles section
  if (path.includes("/roles")) {
    section.value = "roles";
  } else if (path.includes("/settings/members")) {
    section.value = "members";
  } else if (path.includes("/settings/moderation")) {
    section.value = "moderation";
  } else if (path.includes("/settings/audit-log")) {
    section.value = "audit-log";
  } else if (path.includes("/settings/integrations")) {
    section.value = "integrations";
  } else if (pathSegments.length === 4) {
    // /community/@name-id/settings
    section.value = "overview";
  } else if (pathSegments.length > 4) {
    // /community/@name-id/settings/section
    section.value = pathSegments[pathSegments.length - 1] || "overview";
  } else {
    section.value = "overview";
  }
});

const menuItems = computed<MenuItem[][]>(() => [
  [
    {
      label: "SERVER SETTINGS",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Overview",
      icon: "i-lucide-home",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings`,
      active: section.value === "overview" || !section.value,
    },
    {
      label: "General",
      icon: "i-lucide-settings",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/general`,
      active: section.value === "general",
      disabled: true,
    },
    {
      label: "Channels",
      icon: "i-lucide-hash",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/channels`,
      active: section.value === "channels",
      disabled: true,
    },
  ],
  [
    {
      label: "USER MANAGEMENT",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Roles",
      icon: "i-lucide-shield",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/roles`,
      active: section.value === "roles",
    },
    {
      label: "Members",
      icon: "i-lucide-users",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/members`,
      active: section.value === "members",
    },
  ],
  [
    {
      label: "MODERATION",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Moderation",
      icon: "i-lucide-gavel",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/moderation`,
      active: section.value === "moderation",
      disabled: true,
    },
    {
      label: "Audit Log",
      icon: "i-lucide-file-text",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/audit-log`,
      active: section.value === "audit-log",
      disabled: true,
    },
  ],
  [
    {
      label: "INTEGRATIONS",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Integrations",
      icon: "i-lucide-plug",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/integrations`,
      active: section.value === "integrations",
      disabled: true,
    },
  ],
  [
    {
      label: "DANGER ZONE",
      class: "font-bold text-sm text-red-400",
      type: "label",
    },
    {
      label: "Delete Server",
      icon: "i-lucide-trash-2",
      onSelect: () => (isDeleteModalOpen.value = true),
      class: "text-red-400 hover:text-red-300",
    },
  ],
]);
</script>

<template>
  <div
    class="sticky top-0 flex flex-col min-h-screen h-screen w-[200px] border-r border-dark-700 p-4 gap-4 bg-dark-800"
  >
    <!-- Server Info -->
    <div class="flex items-center gap-3 p-3 rounded-lg bg-dark-700">
      <div class="min-w-0 flex">
        <UAvatar
          v-if="currentCommunity?.avatar"
          :src="currentCommunity?.avatar"
          :alt="currentCommunity?.name || 'Server Icon'"
          size="sm"
          class="rounded-full"
        />
        <h3 class="font-semibold text-white truncate ml-2">
          {{ formData.name || currentCommunity?.name || "Máy chủ" }}
        </h3>
      </div>
    </div>

    <!-- Menu Items -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(group, groupIdx) in menuItems"
        :key="groupIdx"
        class="flex flex-col gap-1"
      >
        <div
          v-for="(item, itemIdx) in group"
          :key="itemIdx"
          class="flex items-center gap-2"
        >
          <!-- Label -->
          <template v-if="item.type === 'label'">
            <div class="uppercase font-bold text-xs text-gray-400 py-2 px-2">
              {{ item.label }}
            </div>
          </template>

          <!-- Normal item -->
          <template v-else>
            <UButton
              v-if="item.to"
              :to="item.to"
              :color="item.active ? 'primary' : 'neutral'"
              variant="ghost"
              :disabled="item.disabled"
              class="flex items-center gap-2 px-2 py-2 rounded-md w-full text-sm justify-start"
              :class="{
                'text-primary bg-primary-50 dark:bg-primary-950':
                  item.active && !item.disabled,
                'hover:bg-dark-700 text-gray-300':
                  !item.active && !item.disabled,
                'opacity-50 cursor-not-allowed text-gray-500': item.disabled,
              }"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
              <span>{{ item.label }}</span>
            </UButton>
            <!-- Action item -->
            <UButton
              v-else-if="item.onSelect"
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

    <!-- Delete Community Confirmation Modal -->
    <DeleteCommunityModal
      :community="currentCommunity"
      :open="isDeleteModalOpen"
      @update:open="isDeleteModalOpen = $event"
    />
  </div>
</template>
