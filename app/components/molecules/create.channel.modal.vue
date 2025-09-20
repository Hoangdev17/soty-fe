<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";
import { useChannelStore } from "~/stores/channels/channel.store";

interface Props {
  open: boolean;
  guildId?: string;
  defaultParentId?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "created", channel: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { currentCommunity } = storeToRefs(useCommunityStore());
const channelStore = useChannelStore();

// Form refs
const channelForm = ref<HTMLFormElement>();

// State
const isCreating = ref(false);
const newChannel = ref({
  name: "",
  type: "GUILD_TEXT" as string,
  parentId: "",
  topic: "",
  private: false,
  nsfw: false,
  rateLimitPerUser: 0,
});

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const channelTypeOptions = computed(() => [
  {
    label: "TEXT",
    icon: "i-lucide-hash",
    value: "GUILD_TEXT",
    description: "Kênh văn bản để gửi tin nhắn, hình ảnh và GIF.",
  },
  {
    label: "Voice",
    icon: "i-lucide-volume-2",
    value: "GUILD_VOICE",
    description: "Kênh thoại để trò chuyện bằng giọng nói.",
  },
]);

const channelPlaceholder = computed(() => {
  return newChannel.value.type === "GUILD_VOICE"
    ? "Ví dụ: General Voice"
    : "Ví dụ: general";
});

const categoryOptions = computed(() => {
  const categories =
    channelStore.channels?.filter(
      (channel: any) => channel.type === "GUILD_CATEGORY"
    ) || [];

  const options = [{ label: "Không có danh mục", value: "" }];

  categories.forEach((category: any) => {
    options.push({
      label: category.name,
      value: category.id,
    });
  });

  return options;
});

const rateLimitOptions = computed(() => [
  { label: "Không giới hạn", value: 0 },
  { label: "5 giây", value: 5 },
  { label: "10 giây", value: 10 },
  { label: "15 giây", value: 15 },
  { label: "30 giây", value: 30 },
  { label: "1 phút", value: 60 },
  { label: "2 phút", value: 120 },
  { label: "5 phút", value: 300 },
  { label: "10 phút", value: 600 },
  { label: "15 phút", value: 900 },
  { label: "30 phút", value: 1800 },
  { label: "1 giờ", value: 3600 },
  { label: "2 giờ", value: 7200 },
  { label: "6 giờ", value: 21600 },
]);

// Methods
const createChannel = async () => {
  if (!newChannel.value.name.trim() || !props.guildId) return;

  isCreating.value = true;

  try {
    const channelData: any = {
      name: newChannel.value.name.trim(),
      type: newChannel.value.type,
      guildId: props.guildId,
    };

    // Chỉ thêm các trường có giá trị thực sự
    if (
      newChannel.value.parentId &&
      typeof newChannel.value.parentId === "string" &&
      newChannel.value.parentId.trim() !== ""
    ) {
      channelData.parentId = newChannel.value.parentId.trim();
    }

    if (
      newChannel.value.topic &&
      typeof newChannel.value.topic === "string" &&
      newChannel.value.topic.trim() !== ""
    ) {
      channelData.topic = newChannel.value.topic.trim();
    }

    // NSFW chỉ gửi nếu true
    if (newChannel.value.nsfw === true) {
      channelData.nsfw = true;
    }

    // Rate limit chỉ gửi nếu > 0 và là number
    if (
      typeof newChannel.value.rateLimitPerUser === "number" &&
      newChannel.value.rateLimitPerUser > 0
    ) {
      channelData.rateLimitPerUser = newChannel.value.rateLimitPerUser;
    }

    const createdChannel = await channelStore.createChannel(channelData);
    emit("created", createdChannel);
    closeModal();

    navigateTo(
      `/community/@${currentCommunity.value?.name}-${currentCommunity.value?.id}/${createdChannel.id}`
    );
  } catch (error: any) {
    console.error("Error creating channel:", error);

    // Show error notification
    const toast = useToast();
    toast.add({
      title: "Lỗi!",
      description: error.message || "Không thể tạo kênh. Vui lòng thử lại.",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

const closeModal = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  newChannel.value = {
    name: "",
    type: "GUILD_TEXT",
    parentId: props.defaultParentId || "",
    topic: "",
    private: false,
    nsfw: false,
    rateLimitPerUser: 0,
  };
};

// Watch for modal open to set default parent
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.defaultParentId) {
      newChannel.value.parentId = props.defaultParentId;
    } else if (!isOpen) {
      resetForm();
    }
  }
);

// Watch for defaultParentId changes
watch(
  () => props.defaultParentId,
  (newParentId) => {
    if (newParentId) {
      newChannel.value.parentId = newParentId;
    }
  }
);
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-hash" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">Tạo kênh mới</h3>
      </div>
    </template>

    <template #body>
      <form ref="channelForm" @submit.prevent="createChannel" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Loại kênh *</label>
          <URadioGroup
            v-model="newChannel.type"
            color="primary"
            variant="card"
            :items="channelTypeOptions"
            :disabled="isCreating"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Tên kênh *</label>
          <UInput
            v-model="newChannel.name"
            :placeholder="channelPlaceholder"
            required
            :disabled="isCreating"
            class="w-full"
            maxlength="100"
          />
          <p class="text-xs text-gray-500 mt-1">
            Tên kênh không được trùng với các kênh khác
          </p>
        </div>

        <div class="hidden">
          <label class="block text-sm font-medium mb-1">Danh mục cha</label>
          <USelect
            v-model="newChannel.parentId"
            :options="categoryOptions"
            :disabled="isCreating"
            class="w-full"
            placeholder="Chọn danh mục hoặc để trống"
          />
          <p class="text-xs text-gray-500 mt-1">
            Kênh sẽ được đặt trong danh mục đã chọn
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Mô tả (tùy chọn)</label>
          <UTextarea
            v-model="newChannel.topic"
            placeholder="Mô tả ngắn về kênh này..."
            :disabled="isCreating"
            class="w-full"
            maxlength="500"
            :rows="3"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ newChannel.topic?.length || 0 }}/500 ký tự
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium">Kênh riêng tư</label>
            <USwitch v-model="newChannel.private" :disabled="isCreating" />
          </div>
          <p class="text-xs text-gray-500">
            Chỉ những thành viên được mời mới có thể xem kênh này
          </p>
        </div>

        <div v-if="newChannel.type === 'GUILD_TEXT'" class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium"
              >Nội dung người lớn (NSFW)</label
            >
            <USwitch v-model="newChannel.nsfw" :disabled="isCreating" />
          </div>
          <p class="text-xs text-gray-500">
            Kênh này có thể chứa nội dung không phù hợp với trẻ em
          </p>
        </div>

        <div v-if="newChannel.type === 'GUILD_TEXT'">
          <label class="block text-sm font-medium mb-1"
            >Giới hạn tốc độ tin nhắn</label
          >
          <USelect
            v-model="newChannel.rateLimitPerUser"
            :items="rateLimitOptions"
            :disabled="isCreating"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Thời gian chờ giữa các tin nhắn cho thành viên
          </p>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          color="neutral"
          @click="closeModal"
          :disabled="isCreating"
        >
          Hủy
        </UButton>
        <UButton
          color="primary"
          @click="channelForm?.requestSubmit()"
          :loading="isCreating"
          :disabled="!newChannel.name.trim()"
        >
          Tạo kênh
        </UButton>
      </div>
    </template>
  </UModal>
</template>
