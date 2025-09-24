<script setup lang="ts">
import { ref, computed } from "vue";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useCommunityStore } from "~/stores/community/community.store";

interface Props {
  open?: boolean;
  guildId?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "created", event: any): void;
}>();

const isOpen = computed({
  get: () => !!props.open,
  set: (v: boolean) => emit("update:open", v),
});

const state = ref({
  step: 1,
  title: "",
  location: "",
  description: "",
  startAt: "",
  endAt: "",
  allowedRolesInput: "",
  eventTopic: "",
  startTime: "",
  frequency: "",
  imgUrl: "",
});

interface LocationItem {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

const items = ref<LocationItem[]>([
  {
    label: "Kênh thoại",
    value: "voice",
    description: "Voice channel event.",
    icon: "i-lucide-voice",
  },
  {
    label: "Một nơi nào khác",
    value: "other",
    description: "Other location event.",
    icon: "i-lucide-map-pin",
  },
]);

// frequency options for the event (used in select)
const frequencyOptions = ref([
  { label: "Không lặp lại", value: "NONE" },
  { label: "Chỉ một lần", value: "ONCE" },
  { label: "Hàng ngày", value: "DAILY" },
  { label: "Hàng tuần", value: "WEEKLY" },
  { label: "Hàng tháng", value: "MONTHLY" },
]);

const channelStore = useChannelStore();
// collect all voice channels so we can show them in the select menu
const voiceChannels = computed(() =>
  channelStore.channels.filter((c) => c.type === "GUILD_VOICE")
);

// items for the USelect component
const selectItems = computed(() =>
  voiceChannels.value.map((c: any) => ({ label: c.name, value: c.id }))
);

const firstVoiceName = computed(
  () => voiceChannels.value[0]?.name || "Không có kênh thoại nào"
);

// helper to find the selected channel object (state.title stores selected channel id here)
const selectedChannel = computed(() =>
  voiceChannels.value.find((c: any) => c.id === state.value.title)
);

const selectedChannelName = computed(
  () => selectedChannel.value?.name || state.value.title || ""
);

// selection state for the radio group
const selectedLocation = ref<string>(items.value[0]?.value || "");

// get the full item object with value === 'other'
const otherItem = computed<LocationItem | undefined>(() =>
  items.value.find((i) => i.value === "other")
);

// convenience boolean to check if user selected 'other'
const isOtherSelected = computed(() => selectedLocation.value === "other");

// extra detail when user selects 'other'
const locationDetail = ref<string>("");

const isSubmitting = ref(false);

const { fetchWithAuth } = useFetchWithAuth();
const communityStore = useCommunityStore();

const guildId = computed(
  () => props.guildId || communityStore.currentCommunity?.id || ""
);

const canNext = computed(() => {
  if (state.value.step === 1) {
    // if user selected 'other', require a non-empty location, otherwise require a selected channel (title holds channel id)
    if (selectedLocation.value === "other")
      return state.value.location.trim().length > 0;
    return !!state.value.title;
  }
  if (state.value.step === 2) return !!state.value.startAt;
  return true;
});

// show friendly channel name for review (state.title stores channel id when voice selected)
const currentChannelName = computed(() => {
  if (selectedLocation.value === "other")
    return state.value.location || "(Không rõ)";
  const ch = voiceChannels.value.find((c: any) => c.id === state.value.title);
  return ch ? ch.name : state.value.title || "(Không chọn)";
});

// show human label for frequency
const frequencyLabel = computed(() => {
  const f = frequencyOptions.value.find(
    (o: any) => o.value === state.value.frequency
  );
  return f ? f.label : state.value.frequency || "Chỉ một lần";
});

const next = () => {
  if (!canNext.value) return;
  if (state.value.step < 3) state.value.step += 1;
};

const back = () => {
  if (state.value.step > 1) state.value.step -= 1;
};

function handleUploadSuccess(url: string) {
  console.log("Upload success, got URL:", url);
  state.value.imgUrl = url;
}

const resetState = () => {
  state.value = {
    step: 1,
    title: "",
    location: "",
    description: "",
    startAt: "",
    endAt: "",
    allowedRolesInput: "",
    eventTopic: "",
    startTime: "",
    frequency: "",
    imgUrl: "",
  };
  selectedLocation.value = items.value[0]?.value || "";
  locationDetail.value = "";
};

const close = () => {
  // use the computed setter to notify parent
  isOpen.value = false;
  resetState();
};

const submit = async () => {
  if (!guildId.value) return;
  isSubmitting.value = true;
  try {
    const payload = {
      // eventTopic is the user-provided title/subject
      title: state.value.eventTopic,
      description: state.value.description,
      startAt: state.value.startAt,
      startTime: state.value.startTime,
      meetingUrl:
        selectedLocation.value === "other"
          ? state.value.location
          : selectedChannelName.value,
      frequency: state.value.frequency,
      imgUrl: state.value.imgUrl,
      channelId: state.value.title || undefined,
    };

    // await store action in case it's async so we handle errors and loading correctly
    await communityStore.createEvent(guildId.value, payload);

    emit("created", payload);
    // close & reset
    isOpen.value = false;
    resetState();
  } catch (err) {
    console.error("Create event error", err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" class="max-w-xl">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="w-full">
          <div class="h-2 bg-gray-200 rounded overflow-hidden">
            <div
              class="h-full bg-primary"
              :style="{ width: (state.step / 3) * 100 + '%' }"
            />
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div>
        <div v-if="state.step === 1" class="space-y-4">
          <div class="mx-auto text-center text-lg font-medium">
            <h>Sự kiện của bạn diễn ra ở đâu?</h>
            <p class="text-sm text-gray-500">
              Để không ai bị lạc khi truy cập.
            </p>
          </div>
          <URadioGroup
            color="primary"
            variant="card"
            v-model="selectedLocation"
            :items="items"
          />

          <div v-if="isOtherSelected" class="mt-2">
            <UFormField label="Nhập vị trí *">
              <UInput
                v-model="state.location"
                placeholder="Thêm 1 vị trí,liên kết, hoặc 1 cái gì đó."
                class="w-full"
              />
            </UFormField>
          </div>

          <div v-if="!isOtherSelected" class="mt-2">
            <UFormField label="Chọn kênh thoại *">
              <USelect
                v-model="state.title"
                :items="selectItems"
                :placeholder="firstVoiceName"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <div v-else-if="state.step === 2" class="space-y-4">
          <div class="mx-auto text-center text-lg font-medium">
            <h>Sự kiện của bạn là về chủ đề gì?</h>
            <p class="text-sm text-gray-500">
              Điền thông tin chi tiết cho sự kiện của bạn.
            </p>
          </div>

          <UFormField label="Chủ đề của sự kiện *">
            <UInput
              v-model="state.eventTopic"
              placeholder="Chủ đề sự kiện của bạn là gì?"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-between">
            <UFormField label="Bắt đầu *" class="w-1/2 pr-2">
              <UInput v-model="state.startAt" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Thời gian bắt đầu" class="w-1/2 pl-2">
              <UInput v-model="state.startTime" type="time" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Tần suất sự kiện">
            <USelect
              v-model="state.frequency"
              :items="frequencyOptions"
              placeholder="Chọn tần suất"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Mô tả">
            <UTextarea
              v-model="state.description"
              placeholder="Mô tả thêm về sự kiện của bạn."
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <div>
            <p class="strong">Ảnh bìa</p>
            <p class="text-sm text-gray-500">
              Chọn một hình ảnh đại diện cho sự kiện của bạn.
            </p>
            <MoleculesUploadButton
              :button-text="'Tải lên ảnh bìa'"
              @success="handleUploadSuccess"
            />
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="bg-dark-800 border border-gray-800 p-3 rounded">
            <div class="flex justify-between">
              <div>
                <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
                <span>Bắt đầu vào {{ state.startAt }}</span>
              </div>
              <div>
                <UAvatar>
                  <UIcon name="i-lucide-clock" class="w-5 h-5 text-primary" />
                  <span>{{ state.startTime || "Không rõ" }}</span>
                </UAvatar>
              </div>
            </div>
            <h3>{{ state.eventTopic }}</h3>
            <p class="text-sm text-gray-600">{{ state.description }}</p>

            <USeparator class="mt-2" />
            <div class="flex items-center gap-2 mt-2">
              <UIcon name="i-lucide-volume-1" class="w-5 h-5 text-primary" />
              <span class="text-sm">{{ currentChannelName }}</span>
            </div>
          </div>
          <div class="mt-5 flex flex-col items-center">
            <h2 class="text-xl strong">Đây là bản xem trước sự kiện của bạn</h2>
            <p class="text-sm text-gray-500">
              Sự kiện này sẽ tự động bắt đầu khi đếm giờ
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex justify-between">
        <div>
          <UButton variant="outline" @click="close">Hủy</UButton>
        </div>
        <div class="flex items-center gap-2">
          <UButton variant="outline" v-if="state.step > 1" @click="back"
            >Quay lại</UButton
          >
          <UButton
            color="primary"
            v-if="state.step < 3"
            :disabled="!canNext"
            @click="next"
            >Tiếp theo</UButton
          >
          <UButton
            color="primary"
            v-else
            :loading="isSubmitting"
            @click="submit"
            >Tạo sự kiện</UButton
          >
        </div>
      </div>
    </template>
  </UModal>
</template>
