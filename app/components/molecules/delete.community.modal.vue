<script setup lang="ts">
import { communityActions } from "~/stores/community/community.action";
import { navigateTo } from "#app";

interface Props {
  community: {
    id: string;
    name: string;
  } | null;
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const route = useRoute();
const isLoading = ref(false);

const handleDeleteCommunity = async () => {
  if (!props.community) return;

  const communityId = props.community.id;

  try {
    isLoading.value = true;
    await communityActions.deleteCommunity(communityId);
    isLoading.value = false;
    emit("update:open", false);

    // Navigate away if currently in this community
    const currentGuildId = route.params.guild_id || route.params.guildId;
    if (currentGuildId === communityId) {
      await navigateTo("/@me/channels");
    }
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
          <h3 class="text-lg font-semibold text-white">Delete Server</h3>
        </div>

        <p class="text-gray-300 mb-4">
          Are you sure you want to delete
          <strong class="text-white">{{ community?.name }}</strong
          >? This action cannot be undone.
        </p>

        <div class="text-sm text-gray-400 mb-6">
          <p class="mb-2">This will permanently delete the server and:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>All channels and messages</li>
            <li>All roles and permissions</li>
            <li>All member data</li>
            <li>All server settings</li>
          </ul>
        </div>

        <div class="flex gap-3 justify-end">
          <UButton variant="ghost" color="neutral" @click="handleClose">
            Cancel
          </UButton>
          <UButton
            :loading="isLoading"
            color="error"
            variant="solid"
            @click="handleDeleteCommunity"
          >
            Delete Server
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
