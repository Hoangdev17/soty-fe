<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useCommunityStore } from "~/stores/community/community.store";
import ModalCreateEvent from "~/components/molecules/modal.create.event.vue";
import { useChannelStore } from "~/stores/channels/channel.store";

interface Props {
  isOpen?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
}>();

const isOpenComputed = computed({
  get: () => !!props.isOpen,
  set: (v: boolean) => emit("update:isOpen", v),
});
const { currentCommunity } = storeToRefs(useCommunityStore());

const close = () => {
  isOpenComputed.value = false;
};

// Create modal state
const isCreateOpen = ref(false);

const route = useRoute();
const communityStore = useCommunityStore();

// route param in other pages is `guild_id` (snake_case). Support common variants and fallback to store.
const guildId = computed(() => {
  return (
    (route.params.guild_id as string) ||
    (route.params.guildId as string) ||
    communityStore.currentCommunity?.id ||
    ""
  );
});

const communitySlug = computed(() => {
  const name =
    communityStore.currentCommunity?.name ||
    (route.params.guild_username as string) ||
    "";
  const id = guildId.value || "";
  if (!name && id) return id;
  if (!id) return name;
  return `${name}-${id}`;
});

const channelStore = useChannelStore();

const getChannelName = (id?: string | null) => {
  if (!id) return "";
  const ch = channelStore.channels.find(
    (c: any) => String(c.id) === String(id)
  );
  return ch?.name || "";
};

const formatDMY = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
</script>

<template>
  <UModal v-model:open="isOpenComputed" class="max-w-2xl">
    <template #header>
      <div class="flex w-full">
        <h3
          class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          <UIcon name="i-lucide-calendar" class="inline-block w-5 h-5 mr-2" />
          Community Event
        </h3>
        <USeparator orientation="vertical" class="h-8 ml-2 mr-2" />
        <UButton size="sm" variant="outline" @click="isCreateOpen = true"
          >Tạo sự kiện</UButton
        >
      </div>
    </template>

    <template #body>
      <div
        v-if="currentCommunity?.events?.length === 0"
        class="flex flex-col items-center justify-center"
      >
        <UIcon name="i-lucide-calendar" class="w-20 h-20 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Không có sự kiện nào sắp diễn ra
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Lên lịch sự kiện cho bất ký kế hoạch nào trong máy chủ của bạn.
        </p>
        <p>
          Bạn có thể trao quyền cho người khác để tạo sự kiện trong
          <NuxtLink
            :to="`/community/@${communitySlug}/settings/roles`"
            class="text-blue-500 hover:underline"
            >Cài đặt máy chủ &gt; Vai trò</NuxtLink
          >
        </p>
      </div>

      <div v-else>
        <div class="space-y-3">
          <div
            v-for="ev in currentCommunity?.events"
            :key="ev.id"
            class="p-4 border border-gray-600 rounded-lg hide-scrollbar"
          >
            <div class="flex justify-between">
              <div>
                <UIcon
                  name="i-lucide-clock"
                  class="inline-block w-4 h-4 mr-1"
                />
                <span>Thời gian bắt đầu {{ formatDMY(ev.startAt) }}</span>
              </div>
              <div>
                <UIcon
                  name="i-lucide-repeat"
                  class="inline-block w-4 h-4 mr-1"
                />
                <span>Lặp lại: {{ ev.frequency }}</span>
              </div>
            </div>

            <div>
              <h1 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ ev.title }}
              </h1>
              <div class="flex">
                <img
                  :src="ev.imgUrl"
                  :alt="ev.title || 'Event image'"
                  class="w-20 h-20 object-cover rounded-md mt-2"
                  loading="lazy"
                />
                <p class="text-sm text-gray-500 ml-5">{{ ev.description }}</p>
              </div>
            </div>

            <USeparator class="mt-2" />
            <div class="flex justify-between mt-2">
              <div>
                <UIcon
                  name="i-lucide-volume"
                  class="inline-block w-4 h-4 mr-1"
                />
                <span>{{
                  ev.meetingUrl || getChannelName(ev.channelId) || "—"
                }}</span>
              </div>

              <div>
                <UButton size="sm" variant="outline">Chỉnh sửa</UButton>
                <UButton size="sm" variant="outline" color="error">Xóa</UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex justify-end">
        <UButton variant="outline" @click="close">Đóng</UButton>
      </div>
    </template>
  </UModal>
  <ModalCreateEvent v-model:open="isCreateOpen" />
</template>
