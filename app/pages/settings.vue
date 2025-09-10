<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useAuthStore } from "~/stores/auth/auth.store";

definePageMeta({
  middleware: [requiredAuth],
});

const route = useRoute();
const section = ref("");

watchEffect(() => {
  const pathSegments = route.path.split("/").filter(Boolean);
  // Lấy segment cuối cùng hoặc segment thứ 3 nếu có
  if (pathSegments.length > 2) {
    section.value = pathSegments[pathSegments.length - 1] || "account";
  } else if (pathSegments.length === 2) {
    section.value = pathSegments[1] || "account"; // Lấy phần sau /settings/
  } else {
    section.value = "account";
  }

  console.log("Current route:", route.path, "Section:", section.value);
});

const { user } = useAuthStore();

const closeSettings = () => {
  // Chuyển về trang chính hoặc trang trước đó
  navigateTo("/@me/channels");
};

// Keyboard shortcut ESC to close
onMounted(() => {
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

const items = computed<MenuItem[][]>(() => [
  [
    {
      label: "USER SETTINGS",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "My account",
      icon: "lucide-user",
      to: "/settings/@" + user?.username,
      active:
        section.value === "@" + user?.username ||
        section.value === "account" ||
        route.path.includes("/@"),
    },
    {
      label: "Devices",
      icon: "lucide-tablet",
      to: "/apps/settings/devices",
      active: section.value === "devices" || route.path.includes("/devices"),
    },
    {
      label: "Connections",
      icon: "lucide-unplug",
      to: "/apps/settings/connections",
      active:
        section.value === "connections" || route.path.includes("/connections"),
    },
  ],
  [
    {
      label: "PAYMENT SETTINGS",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Register",
      icon: "lucide-scan-face",
      to: "/apps/settings/subscriptions",
      active:
        section.value === "subscriptions" ||
        route.path.includes("/subscriptions"),
    },
    {
      label: "Payment",
      icon: "lucide-credit-card",
      to: "/apps/settings/billing",
      active: section.value === "billing" || route.path.includes("/billing"),
    },
  ],
  [
    {
      label: "SETTINGS",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Notification settings",
      icon: "lucide-bell",
      to: "/apps/settings/notifications",
      active:
        section.value === "notifications" ||
        route.path.includes("/notifications"),
      disabled: true,
    },
    {
      label: "Language settings",
      icon: "lucide-languages",
      to: "/apps/settings/languages",
      active:
        section.value === "languages" || route.path.includes("/languages"),
    },
  ],
  [
    {
      label: "WHAT'S NEW?",
      class: "font-bold text-sm",
      type: "label",
    },
    {
      label: "Merch",
      icon: "lucide-package",
      to: "/apps/settings/notifications",
      active: section.value === "merch" || route.path.includes("/merch"),
      disabled: true,
    },
  ],
  [
    {
      label: "Logout",
      icon: "lucide-log-out",
      onSelect: () => {},
    },
  ],
]);
</script>

<template>
  <div class="flex items-start size-full">
    <div
      class="sticky top-0 flex flex-col min-h-screen h-screen w-[180px] border-r border-[#2c2f36] p-4 gap-4"
    >
      <!-- Custom Vertical Menu -->
      <div class="flex flex-col gap-4">
        <div
          v-for="(group, groupIdx) in items"
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
              <div
                class="uppercase font-bold text-sm text-muted-foreground py-2"
              >
                {{ item.label }}
              </div>
            </template>

            <!-- Normal item -->
            <template v-else>
              <UButton
                v-if="item.to"
                :to="item.to"
                :color="item.active ? 'primary' : 'gray'"
                variant="ghost"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-sm justify-start"
                :class="{
                  'text-primary-500 bg-primary-50 dark:bg-primary-950':
                    item.active,
                  'hover:bg-gray-100 dark:hover:bg-gray-800': !item.active,
                }"
                :disabled="item.disabled"
              >
                <Icon :name="item.icon" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </UButton>
              <!-- Action item (logout) -->
              <UButton
                v-else-if="item.onSelect"
                color="error"
                variant="ghost"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-sm"
                @click="item.onSelect"
              >
                <UIcon :name="item.icon ?? ''" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full max-w-3xl mx-auto p-4 overflow-y-auto overflow-x-hidden relative"
    >
      <!-- Close button - Discord style -->
      <div class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1">
        <UButton
          @click="closeSettings"
          class="w-9 h-9 rounded-full bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors flex items-center justify-center border border-gray-600"
          title="Đóng Settings"
        >
          <Icon name="lucide-x" class="w-4 h-4 text-white" />
        </UButton>
        <span class="text-xs text-gray-400 font-medium">ESC</span>
      </div>

      <NuxtPage />
    </div>
  </div>
</template>
