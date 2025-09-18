<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import CommunityBanner from "~/components/organisms/community.banner.vue";
import UploadButton from "~/components/molecules/upload.button.vue";
import { useMemberStore } from "~/stores/member/member.store";
import UnsavedChangesBar from "~/components/atoms/unsave.change.vue";
import { useUnsavedChanges } from "~/composables/useUnsavedChanges";

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();
const channelStore = useChannelStore();

const currentCommunity = computed(() => communityStore.currentCommunity);
const { memberCount } = storeToRefs(useMemberStore());

const guildId = ref(route.params.guild_id as string | undefined);

// Watcher để cập nhật guildId khi route thay đổi
watch(
  () => route.params.guild_id,
  (newGuildId) => {
    guildId.value = newGuildId as string | undefined;
  },
  { immediate: true }
);

const section = ref("");

watchEffect(() => {
  const pathSegments = route.path.split("/").filter(Boolean);
  if (pathSegments.length > 4) {
    // /community/@name-id/settings/section
    section.value = pathSegments[pathSegments.length - 1] || "overview";
  } else {
    section.value = "overview";
  }
});

const closeSettings = () => {
  if (hasUnsavedChanges.value) {
    const confirmClose = confirm(
      "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng settings?"
    );
    if (!confirmClose) return;
  }
  // Navigate to community page with current community name
  const guildId = route.params.guild_id as string;
  const communityName = currentCommunity.value?.name || "";
  router.push(`/community/introduce/${guildId}`);
};

// Prevent navigation when there are unsaved changes
const beforeRouteLeave = (to: any, from: any, next: any) => {
  if (hasUnsavedChanges.value) {
    const confirmLeave = confirm(
      "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?"
    );
    if (confirmLeave) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
};

// Add route guard
definePageMeta({
  beforeRouteLeave,
  middleware: ["required-auth"],
});

// Unsaved changes logic
const { hasUnsavedChanges, setUnsavedChanges } = useUnsavedChanges();

// Form data for community settings
const formData = reactive({
  name: "",
  description: "",
  avatar: "",
  banner: "",
});

// Watch for community changes to initialize form data
watch(
  currentCommunity,
  (newCommunity) => {
    if (newCommunity) {
      formData.name = newCommunity.name || "";
      formData.description = newCommunity.description || "";
      formData.avatar = newCommunity.avatar || "";
      formData.banner = newCommunity.banner || "";
    }
  },
  { immediate: true }
);

// Watch form data changes to detect unsaved changes
watch(
  formData,
  (newData) => {
    if (!currentCommunity.value) return;

    const hasChanges =
      newData.name !== (currentCommunity.value.name || "") ||
      newData.description !== (currentCommunity.value.description || "") ||
      newData.avatar !== (currentCommunity.value.avatar || "") ||
      newData.banner !== (currentCommunity.value.banner || "");

    setUnsavedChanges(hasChanges, "Bạn có thay đổi chưa lưu!");
  },
  { deep: true }
);

// Save changes
const saveChanges = async () => {
  if (!currentCommunity.value) return;

  try {
    await communityStore.updateCommunity(currentCommunity.value.id, {
      name: formData.name,
      description: formData.description,
      avatar: formData.avatar,
      banner: formData.banner,
    });

    setUnsavedChanges(false);
  } catch (error) {
    console.error("Failed to save changes:", error);
    // You can add toast notification here
  }
};

// Reset changes
const resetChanges = () => {
  if (!currentCommunity.value) return;

  formData.name = currentCommunity.value.name || "";
  formData.description = currentCommunity.value.description || "";
  formData.avatar = currentCommunity.value.avatar || "";
  formData.banner = currentCommunity.value.banner || "";
  setUnsavedChanges(false);
};

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
    },
    {
      label: "Channels",
      icon: "i-lucide-hash",
      to: `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/settings/channels`,
      active: section.value === "channels",
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
]);

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleAvatarUploadSuccess = async (url: string) => {
  formData.avatar = url;
};

const handleBannerUploadSuccess = async (url: string) => {
  formData.banner = url;
};

const handleUploadError = (error: string) => {
  console.error("Upload failed:", error);
  // You can add toast notification here
};

onMounted(async () => {
  const guildId = route.params.guild_id as string;
  if (guildId && !currentCommunity.value) {
    await communityStore.fetchCommunityById(guildId);
  }
});
</script>

<template>
  <div class="flex items-start size-full bg-dark-900">
    <!-- Sidebar -->
    <OrganismsSidebarSettingCommunity />

    <!-- Main Content -->
    <div
      class="w-full max-w-4xl mx-auto p-6 overflow-y-auto overflow-x-hidden relative bg-dark-900"
    >
      <!-- Close button -->
      <div class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1">
        <UButton
          @click="closeSettings"
          class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors flex items-center justify-center border border-dark-600"
          title="Đóng Settings"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4 text-white" />
        </UButton>
        <span class="text-xs text-gray-400 font-medium">ESC</span>
      </div>

      <!-- Content -->
      <div
        v-if="!$route.params.section || $route.params.section === 'overview'"
        class="space-y-6"
      >
        <!-- Main Layout with Preview Sidebar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Content -->
          <div class="lg:col-span-2 space-y-6">
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-2 text-white">
                Chào mừng đến với cài đặt máy chủ
              </h2>
              <p class="text-gray-400">
                Quản lý và tùy chỉnh máy chủ của bạn. Thay đổi cài đặt, quản lý
                thành viên, và nhiều hơn nữa.
              </p>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UCard class="bg-dark-800 border-dark-700">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center"
                  >
                    <UIcon name="i-lucide-users" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-white">
                      {{ memberCount || 0 }}
                    </p>
                    <p class="text-sm text-gray-400">Thành viên</p>
                  </div>
                </div>
              </UCard>

              <UCard class="bg-dark-800 border-dark-700">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"
                  >
                    <UIcon name="i-lucide-hash" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-white">
                      {{ channelStore.channels?.length || 0 }}
                    </p>
                    <p class="text-sm text-gray-400">Kênh</p>
                  </div>
                </div>
              </UCard>

              <UCard class="bg-dark-800 border-dark-700">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center"
                  >
                    <UIcon name="i-lucide-shield" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-white">
                      {{ currentCommunity?.premiumTier || 0 }}
                    </p>
                    <p class="text-sm text-gray-400">Cấp độ Premium</p>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Community name -->
            <USeparator class="w-full" />
            <UFormField label="Community name" class="w-full">
              <UInput
                v-model="formData.name"
                class="w-full"
                placeholder="Community name"
              />
            </UFormField>
            <USeparator class="w-full" />

            <UFormField label="Description" class="w-full">
              <UTextarea
                v-model="formData.description"
                class="w-full"
                placeholder="Description"
              />
            </UFormField>
            <USeparator class="w-full" />

            <UFormField label="Avatar" class="">
              <UploadButton
                button-text="Add avatar"
                accept="image/*"
                :max-size="2"
                @success="handleAvatarUploadSuccess"
                @error="handleUploadError"
                class="mt-2"
              />
            </UFormField>
            <USeparator class="w-full" />

            <UFormField label="Banner" class="">
              <UploadButton
                button-text="Add banner"
                accept="image/*"
                :max-size="2"
                @success="handleBannerUploadSuccess"
                @error="handleUploadError"
                class="mt-2"
              />
            </UFormField>
          </div>

          <!-- Right Preview Sidebar -->
          <div class="lg:col-span-1">
            <div class="sticky top-6">
              <!-- Server Overview Card -->
              <UCard class="bg-dark-800 border-dark-700 overflow-hidden">
                <!-- Banner inside card -->
                <div class="relative">
                  <CommunityBanner
                    :banner="formData.banner || currentCommunity?.banner"
                    :name="formData.name || currentCommunity?.name || 'Máy chủ'"
                    :height-class="'h-32'"
                    class="w-full rounded-t-lg"
                  />
                  <!-- Avatar overlay -->
                  <div
                    class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-4 border-dark-800 z-10"
                  >
                    <img
                      v-if="formData.avatar || currentCommunity?.avatar"
                      :src="formData.avatar || currentCommunity?.avatar"
                      :alt="formData.name || currentCommunity?.name"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full bg-primary rounded-full flex items-center justify-center"
                    >
                      <UIcon
                        name="i-lucide-settings"
                        class="w-8 h-8 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div class="text-center pt-10 pb-4">
                  <h3 class="text-lg font-bold text-white mb-1">
                    {{ formData.name || currentCommunity?.name || "Máy chủ" }}
                  </h3>
                  <p class="text-gray-400 text-sm mb-4">
                    {{
                      formData.description ||
                      currentCommunity?.description ||
                      "Không có mô tả"
                    }}
                  </p>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">Thành viên</span>
                    <span class="text-white font-semibold">{{
                      currentCommunity?.memberCount || 0
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">Kênh</span>
                    <span class="text-white font-semibold">{{
                      channelStore.channels?.length || 0
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">Premium</span>
                    <span class="text-white font-semibold">{{
                      currentCommunity?.premiumTier || 0
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">Ngày tạo</span>
                    <span class="text-white font-semibold">{{
                      formatDate(currentCommunity?.createdAt)
                    }}</span>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub-pages content -->
      <NuxtPage v-else />
    </div>

    <!-- Unsaved Changes Bar -->
    <UnsavedChangesBar
      :show="hasUnsavedChanges"
      title="Cẩn thận — bạn có thay đổi chưa lưu!"
      save-label="Lưu Thay Đổi"
      reset-label="Đặt lại"
      @save="saveChanges"
      @reset="resetChanges"
    />
  </div>
</template>
