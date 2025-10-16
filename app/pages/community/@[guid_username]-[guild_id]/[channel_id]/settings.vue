<script setup lang="ts">
import MobileCommunitySettingsWrapper from "~/components/organisms/mobile.community.settings.wrapper.vue";
import SidebarSettingChannel from "~/components/organisms/sidebar.setting.channel.vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import UnsaveChange from "~/components/atoms/unsave.change.vue";
import { useUnsavedChanges } from "~/composables/useUnsavedChanges";
import { useBreakpoint } from "~/composables/useBreakpoint.client";
import DeleteChannelModal from "~/components/molecules/delete.channel.modal.vue";

const { isMobile } = useBreakpoint();
const route = useRoute();
const router = useRouter();
const guildId = route.params.guild_id as string;
const channelId = route.params.channel_id as string;
const guildUsername = route.params.guid_username as string;

definePageMeta({
  middleware: ["required-auth"],
});

useHead({
  title: `Soty | Channel Settings`,
});

const channelStore = useChannelStore();
const { fetchWithAuth } = useFetchWithAuth();

// unsaved changes composable
const { hasUnsavedChanges, setUnsavedChanges } = useUnsavedChanges();

const form = reactive({
  name: "",
  topic: "",
  nsfw: false,
  private: false,
  rateLimitPerUser: 0,
});

// snapshot of the last saved/loaded form to compare changes
const originalForm = ref(JSON.parse(JSON.stringify(form)) as any);

const cloneForm = (src: any) => JSON.parse(JSON.stringify(src));

const isFormDifferent = computed(() => {
  try {
    return JSON.stringify(form) !== JSON.stringify(originalForm.value);
  } catch (e) {
    return true;
  }
});

const isSaving = ref(false);
const isDeleting = ref(false);
const isDeleteModalOpen = ref(false);

onMounted(async () => {
  try {
    await channelStore.fetchChannelById(guildId, channelId);
    const ch = channelStore.currentChannel;
    if (ch) {
      form.name = ch.name || "";
      form.topic = ch.topic || "";
      form.private = ch.isPrivate ? true : false;
      form.nsfw = !!ch.nsfw;
      form.rateLimitPerUser = ch.rateLimitPerUser || 0;
    }
    // capture snapshot after initial load so it's not considered "unsaved"
    originalForm.value = cloneForm(form);
  } catch (e) {}
});

const deleteChannel = async () => {
  // open confirmation modal
  isDeleteModalOpen.value = true;
};

const handleConfirmDelete = async () => {
  isDeleting.value = true;
  try {
    await fetchWithAuth(`/channels/${guildId}/${channelId}`, {
      method: "DELETE",
    });
    // after delete go to community home
    router.push(`/community/@${guildUsername}-${guildId}`);
  } catch (err) {
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};
const saveChanges = async () => {
  isSaving.value = true;
  try {
    const payload: any = {
      name: form.name?.trim(),
      topic: form.topic?.trim() || undefined,
      nsfw: form.nsfw || undefined,
      rateLimitPerUser:
        typeof form.rateLimitPerUser === "number" && form.rateLimitPerUser > 0
          ? form.rateLimitPerUser
          : undefined,
    };

    await fetchWithAuth(`/channels/${guildId}/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    // refresh channel
    await channelStore.fetchChannelById(guildId, channelId);
    // navigate back to channel view
    router.push(`/community/@${guildUsername}-${guildId}/${channelId}`);
  } catch (err) {
  } finally {
    isSaving.value = false;
    // saved -> clear unsaved flag
    setUnsavedChanges(false);
    // update snapshot to current saved values
    originalForm.value = cloneForm(form);
  }
};

// Called by the unsaved bar save button
const saveFromBar = async () => {
  await saveChanges();
};

// Reset form values to the current channel values
const resetChanges = () => {
  // revert to last saved snapshot
  if (originalForm.value) {
    const snap = cloneForm(originalForm.value);
    form.name = snap.name || "";
    form.topic = snap.topic || "";
    form.private = snap.private ? true : false;
    form.nsfw = !!snap.nsfw;
    form.rateLimitPerUser = snap.rateLimitPerUser || 0;
    setUnsavedChanges(false);
  }
};

// watch computed difference to set unsaved state
watch(
  isFormDifferent,
  (val) => {
    setUnsavedChanges(val);
  },
  { immediate: true }
);
</script>

<template>
  <MobileCommunitySettingsWrapper
    current-section="channel"
    title="Channel Settings"
  >
    <template #default>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-white">Channel Settings</h2>
          <p class="text-gray-400 text-sm mt-1">
            Update channel details and moderation settings.
          </p>
        </div>

        <div class="bg-dark-800 p-4 rounded">
          <label class="block text-sm text-gray-300">Name</label>
          <input
            v-model="form.name"
            class="w-full mt-2 p-2 bg-dark-900 border border-dark-700 rounded text-white"
          />
        </div>

        <div class="bg-dark-800 p-4 rounded">
          <label class="block text-sm text-gray-300">Topic</label>
          <textarea
            v-model="form.topic"
            rows="3"
            class="w-full mt-2 p-2 bg-dark-900 border border-dark-700 rounded text-white"
          ></textarea>
        </div>

        <div class="bg-dark-800 p-4 rounded flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-300">NSFW</div>
            <div class="text-xs text-gray-400">
              Mark channel as not safe for work
            </div>
          </div>
          <input type="checkbox" v-model="form.nsfw" class="w-5 h-5" />
        </div>

        <div class="bg-dark-800 p-4 rounded">
          <label class="block text-sm text-gray-300">Slowmode (seconds)</label>
          <input
            type="number"
            v-model.number="form.rateLimitPerUser"
            min="0"
            class="w-32 mt-2 p-2 bg-dark-900 border border-dark-700 rounded text-white"
          />
        </div>

        <div class="flex items-center gap-3">
          <UButton :disabled="isSaving" color="primary" @click="saveChanges">{{
            isSaving ? "Saving..." : "Save Changes"
          }}</UButton>
          <UButton
            variant="ghost"
            color="error"
            :disabled="isDeleting"
            @click="deleteChannel"
            >{{ isDeleting ? "Deleting..." : "Delete Channel" }}</UButton
          >
        </div>
        <!-- unsaved changes bar (mobile/default view) -->
        <UnsaveChange
          :show="hasUnsavedChanges"
          @save="saveFromBar"
          @reset="resetChanges"
        />
        <DeleteChannelModal
          :open="isDeleteModalOpen"
          :guildId="guildId"
          :channel="channelStore.currentChannel"
          @update:open="
            (v) => {
              isDeleteModalOpen = v;
            }
          "
        />
      </div>
    </template>

    <template #desktop>
      <SidebarSettingChannel
        :channel="channelStore.currentChannel"
        @delete="deleteChannel"
      />

      <div
        class="w-full max-w-3xl mx-auto p-6 overflow-y-auto overflow-x-hidden relative bg-dark-900"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-white">Channel Settings</h2>
            <p class="text-gray-400 mt-1">Manage channel options and details</p>
          </div>
        </div>

        <div class="space-y-6">
          <UFormField
            label="Channel Name"
            type="text"
            v-model="form.name"
            placeholder="Enter channel name"
            required
          >
            <UInput v-model="form.name" class="w-full" />
          </UFormField>

          <UFormField label="Topic" type="text" v-model="form.topic">
            <UTextarea
              v-model="form.topic"
              class="w-full"
              placeholder="Enter channel topic (optional)"
            />
          </UFormField>

          <div class="flex justify-between items-center">
            <span>Not safe for work</span>
            <USwitch v-model="form.nsfw" />
          </div>

          <UFormField
            label="User limit (seconds)"
            type="number"
            v-model.number="form.rateLimitPerUser"
            hint="Set to 0 to disable user limit"
          >
            <UInput
              type="number"
              v-model.number="form.rateLimitPerUser"
              class="w-32"
              min="0"
            />
          </UFormField>

          <div class="flex justify-between">
            <span>Kênh riêng tư</span>
            <USwitch v-model="form.private" />
          </div>
        </div>

        <div
          v-if="!isMobile"
          class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1"
        >
          <UButton
            @click="$router.back()"
            class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors flex items-center justify-center border border-dark-600"
            title="Đóng Member Settings"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4 text-white" />
          </UButton>
          <span class="text-xs text-gray-400 font-medium">ESC</span>
        </div>
      </div>
      <UnsaveChange
        :show="hasUnsavedChanges"
        @save="saveFromBar"
        @reset="resetChanges"
      />
      <DeleteChannelModal
        :open="isDeleteModalOpen"
        :guildId="guildId"
        :channel="channelStore.currentChannel"
        @update:open="
          (v) => {
            isDeleteModalOpen = v;
          }
        "
      />
    </template>
  </MobileCommunitySettingsWrapper>
</template>
