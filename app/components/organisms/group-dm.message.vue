<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useRoute } from "vue-router";
import { useMessageStore } from "~/stores/message/message.store";

const messageStore = useMessageStore();

const route = useRoute();
const channelStore = useChannelStore();
const authStore = useAuthStore();

const channelId = computed(() => route.params.channel_id as string);
const isOpenMemberList = ref(false);
const replyToMessage = ref(null);
const { getUserDisplayName } = useDisplayName();

const { currentChannel } = storeToRefs(channelStore);

// Get all group members (excluding current user for member list)
const groupMembers = computed(() => {
  const recipients = currentChannel.value?.recipients;
  if (!recipients?.length) return [];

  return recipients.filter((r) => r.id !== authStore.user?.id);
});

// Get display avatar - use channel icon or default
const displayAvatar = computed(() => {
  return (currentChannel.value as any)?.icon || null;
});

// Get display name - use channel name or generate from members
const displayName = computed(() => {
  if (currentChannel.value?.name) {
    return currentChannel.value.name;
  }

  // Generate name from first 3 members
  const memberNames = groupMembers.value
    .slice(0, 3)
    .map((m) => getUserDisplayName(m))
    .join(", ");

  if (groupMembers.value.length > 3) {
    return `${memberNames}, +${groupMembers.value.length - 3}`;
  }

  return memberNames || "Group Chat";
});

const hasMessages = computed(() => {
  const messages = messageStore.getMessagesByRoom(channelId.value);
  return messages && messages.length > 0;
});

const messageLoading = computed(() => messageStore.isLoading);

// Watch for channel changes and fetch messages
watch(channelId, async (newChannelId, oldChannelId) => {
  if (newChannelId && newChannelId !== oldChannelId) {
    try {
      await messageStore.fetchMessages(newChannelId);
    } catch (error) {}
  }
});

function toggleMemberList() {
  isOpenMemberList.value = !isOpenMemberList.value;
}

function closeMemberList() {
  isOpenMemberList.value = false;
}

function handleReply(message: any) {
  replyToMessage.value = message;
}

function handleReplySent() {
  replyToMessage.value = null;
}

function handleReplyCancelled() {
  replyToMessage.value = null;
}

onMounted(async () => {
  if (channelId.value) {
    try {
      await messageStore.fetchMessages(channelId.value);
      if (!authStore.friends) {
        authStore.getUserFriendList();
      }
      // Fetch decorations for all members
      const allMembers = [authStore.user, ...groupMembers.value].filter(
        Boolean
      );

      for (const member of allMembers) {
        const m = member as any;
        if (
          m?.nameplateId &&
          !authStore.nameTagDecoration.find((d) => d.id === m.nameplateId)
        ) {
          await authStore.fetchNameTagDecorationById(m.nameplateId);
        }
        if (
          m?.avatarEffectId &&
          !authStore.decoration.find((d) => d.id === m.avatarEffectId)
        ) {
          await authStore.fetchAvatarDecorationById(m.avatarEffectId);
        }
      }
    } catch (error) {}
  }
});

// Get avatar effect for a specific member
const getMemberAvatarEffectUrl = (member: any) => {
  if (!member?.avatarEffectId) return null;

  const avatarEffect = authStore.decoration.find(
    (d) => d.id === member.avatarEffectId
  );

  return avatarEffect?.metadata.link || null;
};

// Get nametag effect for a specific member
const getMemberNametagEffectUrl = (member: any) => {
  if (!member?.nameplateId) return null;

  const nametagEffect = authStore.nameTagDecoration.find(
    (d) => d.id === member.nameplateId
  );

  // Build URL from metadata.asset like in nametag.decoration.modal.vue
  if (nametagEffect?.metadata?.asset) {
    return `https://cdn.discordapp.com/assets/collectibles/${nametagEffect.metadata.asset}asset.webm`;
  }

  return nametagEffect?.metadata?.link || null;
};
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
    <!-- Main Chat Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300 min-w-0"
      :class="{
        'mr-[320px]': isOpenMemberList,
      }"
    >
      <!-- Group Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-3">
          <div class="relative flex-shrink-0">
            <UAvatar :src="displayAvatar!" :alt="displayName" size="lg" />
          </div>
          <div class="flex flex-col">
            <h1 class="text-white font-semibold truncate">
              {{ displayName }}
            </h1>
            <span class="text-xs text-gray-400">
              {{ groupMembers.length + 1 }} members
            </span>
          </div>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            variant="ghost"
            @click="toggleMemberList"
          >
            <UIcon name="i-lucide-users" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="flex-1 flex flex-col justify-end min-h-0 bg-dark-800">
        <!-- Welcome message -->
        <AtomsMessageLoading v-if="messageLoading" />
        <div
          v-if="!hasMessages"
          class="flex flex-col items-start text-left p-4"
        >
          <div class="flex items-center mb-4">
            <div class="relative mr-3">
              <UAvatar :src="displayAvatar!" :alt="displayName" size="lg" />
            </div>
          </div>
          <h2 class="text-white text-xl font-bold">
            Chào mừng đến với {{ displayName }}
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            Đây là nơi bắt đầu cuộc trò chuyện nhóm của bạn với
            {{ groupMembers.length }} thành viên.
          </p>
        </div>

        <!-- Message list -->
        <MoleculesMessageList
          v-if="hasMessages"
          :roomId="channelId"
          class="flex-1 min-h-0"
          @reply="handleReply"
        />
      </div>

      <!-- Message Input -->
      <div class="message-input-area p-2">
        <div
          class="transition-all duration-300"
          :class="{
            'max-w-full': !isOpenMemberList,
            'max-w-4xl mx-auto': isOpenMemberList,
          }"
        >
          <MoleculesMessageInput
            :channelId="channelId"
            :replyTo="replyToMessage || undefined"
            @reply-sent="handleReplySent"
            @reply-cancelled="handleReplyCancelled"
          />
        </div>
      </div>
    </div>

    <!-- Member List Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenMemberList"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 overflow-hidden z-50"
      >
        <div class="relative z-10 h-full overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-white font-semibold flex items-center text-lg">
              <UIcon name="i-lucide-users" class="w-5 h-5 mr-2" />
              Members — {{ groupMembers.length + 1 }}
            </h3>
            <UButton
              @click="closeMemberList"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>

          <!-- Members List -->
          <div class="space-y-2">
            <!-- Current User -->
            <div
              class="w-full p-1 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <div
                class="relative w-full px-2 py-1 rounded overflow-hidden flex items-center space-x-3"
              >
                <!-- Nametag Effect Background -->
                <video
                  v-if="getMemberNametagEffectUrl(authStore.user)"
                  :src="getMemberNametagEffectUrl(authStore.user) || ''"
                  autoplay
                  loop
                  muted
                  playsinline
                  class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style="z-index: 1"
                />

                <!-- Avatar inside nametag -->
                <div class="relative flex-shrink-0 z-10">
                  <UAvatar
                    :src="authStore.user?.avatar!"
                    :alt="getUserDisplayName(authStore.user)"
                    size="lg"
                  />
                  <!-- Avatar Effect Overlay -->
                  <img
                    v-if="getMemberAvatarEffectUrl(authStore.user)"
                    :src="getMemberAvatarEffectUrl(authStore.user) || ''"
                    alt="Avatar Effect"
                    class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </div>

                <!-- Username -->
                <div class="flex-1 min-w-0 relative z-10">
                  <div class="text-white font-medium truncate">
                    {{ getUserDisplayName(authStore.user) }}
                    <span class="text-gray-400 text-xs ml-1">(You)</span>
                  </div>
                  <div class="text-gray-400 text-xs truncate">
                    @{{ authStore.user?.username }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Other Members -->
            <div
              v-for="member in groupMembers"
              :key="member.id"
              class="w-full p-1 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer"
            >
              <div
                class="relative w-full px-2 py-1 rounded overflow-hidden flex items-center space-x-3"
              >
                <!-- Nametag Effect Background -->
                <video
                  v-if="getMemberNametagEffectUrl(member)"
                  :src="getMemberNametagEffectUrl(member) || ''"
                  autoplay
                  loop
                  muted
                  playsinline
                  class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style="z-index: 1"
                />

                <!-- Avatar inside nametag -->
                <div class="relative flex-shrink-0 z-10">
                  <UAvatar
                    :src="member.avatar!"
                    :alt="getUserDisplayName(member)"
                    size="lg"
                  />
                  <!-- Avatar Effect Overlay -->
                  <img
                    v-if="getMemberAvatarEffectUrl(member)"
                    :src="getMemberAvatarEffectUrl(member) || ''"
                    alt="Avatar Effect"
                    class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </div>

                <!-- Username -->
                <div class="flex-1 min-w-0 relative z-10">
                  <div class="text-white font-medium truncate">
                    {{ getUserDisplayName(member) }}
                  </div>
                  <div class="text-gray-400 text-xs truncate">
                    @{{ member.username }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
