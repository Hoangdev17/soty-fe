<script setup lang="ts">
import { channelActions } from "~/stores/channels/channel.action";
import { navigateTo } from "#app";

interface Props {
  guildId?: string;
  channel?: { id: string; name?: string } | null;
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const route = useRoute();
const isLoading = ref(false);

const handleDeleteChannel = async () => {
  if (!props.channel || !props.channel.id || !props.guildId) return;

  try {
    isLoading.value = true;
    await channelActions.deleteChannel(props.guildId, props.channel.id);
    isLoading.value = false;
    emit("update:open", false);

    // navigate away to community home
    await navigateTo(`/community/introduce/${props.guildId}`);
  } catch (error) {
    isLoading.value = false;
  }
};

const handleClose = () => {
  emit("update:open", false);
};
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-red-500" />
          <h3 class="text-lg font-semibold text-white">Delete Channel</h3>
        </div>

        <p class="text-gray-300 mb-4">
          Are you sure you want to delete
          <strong class="text-white">{{ channel?.name }}</strong
          >? This action cannot be undone.
        </p>

        <div class="text-sm text-gray-400 mb-6">
          <p class="mb-2">
            This will permanently delete the channel and its messages.
          </p>
        </div>

        <div class="flex gap-3 justify-end">
          <UButton variant="ghost" color="neutral" @click="handleClose"
            >Cancel</UButton
          >
          <UButton
            :loading="isLoading"
            color="error"
            variant="solid"
            @click="handleDeleteChannel"
            >Delete Channel</UButton
          >
        </div>
      </div>
    </template>
  </UModal>
</template>
