<script setup lang="ts">
import type { VoiceParticipantData } from "~/composables/useCommunityVoice";
import { useAuthStore } from "~/stores/auth/auth.store";

interface Props {
  channelId: string;
  participants: VoiceParticipantData[];
}

const props = defineProps<Props>();
const authStore = useAuthStore();

// Make avatar effect URL reactive to store changes
const getAvatarEffectUrl = computed(() => {
  return (participant: VoiceParticipantData) => {
    if (!participant.avatarEffectId) return null;

    // Find effect in store
    const effect = authStore.decoration?.find(
      (d: any) => d.id === participant.avatarEffectId
    );

    // If not found, fetch it (will update store and trigger re-render)
    if (!effect) {
      authStore.fetchAvatarDecorationById(participant.avatarEffectId);
      return null; // Return null for now, will update when fetched
    }

    return effect?.metadata?.link || effect?.metadata?.image || null;
  };
});
</script>

<template>
  <div v-if="participants.length > 0" class="pl-8 py-1 space-y-1">
    <div
      v-for="participant in participants"
      :key="participant.participantId"
      class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700/50 transition-colors group"
    >
      <!-- Avatar with effect -->
      <div class="relative flex-shrink-0">
        <UAvatar
          :src="participant.avatar || ''"
          :alt="participant.username"
          size="xs"
          class="w-6 h-6"
        />
        <img
          v-if="getAvatarEffectUrl(participant)"
          :src="getAvatarEffectUrl(participant)!"
          alt="avatar-effect"
          class="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        <!-- Voice indicator -->
        <div
          class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center"
        >
          <UIcon name="i-lucide-mic" class="w-2 h-2 text-white" />
        </div>
      </div>

      <!-- Username -->
      <span class="text-xs text-gray-300 truncate flex-1">
        {{ participant.username }}
      </span>
    </div>
  </div>
</template>
