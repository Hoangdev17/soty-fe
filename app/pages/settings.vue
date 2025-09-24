<script setup lang="ts">
import requiredAuth from "~/middleware/required.auth";
import { useAuthStore } from "~/stores/auth/auth.store";
import FloatingUserCard from "~/components/organisms/floating.user.card.vue";
import { useBreakpoint } from "~/composables/useBreakpoint.client";

definePageMeta({
  middleware: [requiredAuth],
});

const { isMobile } = useBreakpoint();

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

function handleLogout() {
  const authStore = useAuthStore();
  authStore.logout();
  navigateTo("/login");
}

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
      label: "Nitro",
      icon: "lucide-credit-card",
      to: "/settings/nitros",
      active: section.value === "nitros" || route.path.includes("/nitros"),
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
      onSelect: () => {
        handleLogout();
      },
    },
  ],
]);
</script>

<template>
  <div class="flex items-start size-full">
    <!-- Sidebar - Hidden on mobile -->
    <div
      v-if="!isMobile"
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
                :color="item.active ? 'primary' : 'neutral'"
                variant="ghost"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-sm justify-start"
                :class="{
                  'text-primary-500 bg-primary-50 dark:bg-primary-950':
                    item.active,
                  'hover:bg-gray-100 dark:hover:bg-gray-800': !item.active,
                }"
                :disabled="item.disabled"
              >
                <Icon :name="item.icon!" class="w-4 h-4" />
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
      :class="{ 'pb-20': isMobile }"
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

    <!-- Bottom Navigation for Mobile -->
    <div
      v-if="isMobile"
      class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-2 flex justify-around"
    >
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :to="'/settings/@' + user?.username"
        class="flex flex-col items-center gap-1"
        :class="{
          'text-primary':
            section === '@' + user?.username ||
            section === 'account' ||
            route.path.includes('/@'),
        }"
      >
        <UIcon name="lucide-user" class="w-5 h-5" />
        <span class="text-xs">Account</span>
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        to="/apps/settings/devices"
        class="flex flex-col items-center gap-1"
        :class="{
          'text-primary':
            section === 'devices' || route.path.includes('/devices'),
        }"
      >
        <UIcon name="lucide-tablet" class="w-5 h-5" />
        <span class="text-xs">Devices</span>
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        to="/apps/settings/connections"
        class="flex flex-col items-center gap-1"
        :class="{
          'text-primary':
            section === 'connections' || route.path.includes('/connections'),
        }"
      >
        <UIcon name="lucide-unplug" class="w-5 h-5" />
        <span class="text-xs">Connections</span>
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        to="/apps/settings/billing"
        class="flex flex-col items-center gap-1"
        :class="{
          'text-primary':
            section === 'billing' || route.path.includes('/billing'),
        }"
      >
        <UIcon name="lucide-credit-card" class="w-5 h-5" />
        <span class="text-xs">Billing</span>
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        to="/apps/settings/languages"
        class="flex flex-col items-center gap-1"
        :class="{
          'text-primary':
            section === 'languages' || route.path.includes('/languages'),
        }"
      >
        <UIcon name="lucide-languages" class="w-5 h-5" />
        <span class="text-xs">Language</span>
      </UButton>
    </div>

    <!-- Floating User Card -->
    <FloatingUserCard v-if="!isMobile" class="mb-3 ml-2" />
  </div>
</template>
