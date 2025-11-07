<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useRoute } from "vue-router";
import { useMessageStore } from "~/stores/message/message.store";
import { ChannelType } from "~/stores/channels/channel.type";

const messageStore = useMessageStore();

const route = useRoute();
const channelStore = useChannelStore();
const authStore = useAuthStore();

const channelId = computed(() => route.params.channel_id as string);
const isOpenUserProfile = ref(false);
const replyToMessage = ref(null);
const { getUserDisplayName } = useDisplayName();

const { currentChannel } = storeToRefs(channelStore);

// Get the other user in the DM (not the current user)
const dmRecipient = computed(() => {
  const recipients = currentChannel.value?.recipients;
  if (!recipients?.length) return null;

  return recipients.find((r) => r.id !== authStore.user?.id) || null;
});

// Get display avatar - use channel icon for GROUP_DM, otherwise use recipient avatar
const displayAvatar = computed(() => {
  if (currentChannel.value?.type === ChannelType.GROUP_DM) {
    return (currentChannel.value as any).icon || null;
  }
  return dmRecipient.value?.avatar || null;
});

// Get display name - use channel name for GROUP_DM, otherwise use recipient username
const displayName = computed(() => {
  if (currentChannel.value?.type === ChannelType.GROUP_DM) {
    return currentChannel.value?.name || "Group Chat";
  }
  return getUserDisplayName(dmRecipient.value) || "User";
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

function toggleUserProfile() {
  isOpenUserProfile.value = !isOpenUserProfile.value;
}

function closeUserProfile() {
  isOpenUserProfile.value = false;
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
    } catch (error) {}
  }
});

const isFriend = computed(() => {
  if (!dmRecipient.value) return false;
  return authStore.friends?.some((f) => f.id === dmRecipient.value!.id);
});

const userRecipient = computed(() => {
  const user = authStore.friends?.find((f) => f.id === dmRecipient.value?.id);
  return user;
});

const getAvatarEffectUrl = () => {
  if (!userRecipient.value?.avatarEffectId) return null;

  const avatarEffect = authStore.decoration.find(
    (d) => d.id === userRecipient.value?.avatarEffectId
  );

  return avatarEffect?.metadata.link || null;
};

// Profile effect data
const currentProfileEffect = ref<any>(null);

// Fetch profile effect when user changes
watch(
  () => userRecipient.value?.profileEffectId,
  async (profileEffectId) => {
    if (!profileEffectId) {
      currentProfileEffect.value = null;
      return;
    }

    try {
      const profileEffect = await authStore.fetchProfileDecorationById(
        profileEffectId
      );
      currentProfileEffect.value = profileEffect;
    } catch (error) {
      console.error("Failed to fetch profile effect:", error);
      currentProfileEffect.value = null;
    }
  },
  { immediate: true }
);

// Get profile effect style (same logic as account.page.profile.tab.vue)
const profileEffectStyle = computed(() => {
  if (!currentProfileEffect.value?.metadata?.effects) return {};

  const effects = currentProfileEffect.value.metadata.effects;
  const introEffect = effects.find((e: any) => !e.loop);
  const loopEffect = effects.find((e: any) => e.loop);

  if (!introEffect && !loopEffect) return {};

  // Calculate durations
  const introDuration = introEffect?.duration || 0;
  const loopStart = loopEffect?.start || 0;
  const loopDuration = loopEffect?.duration || 0;
  const totalDuration = Math.max(
    introDuration + loopStart + loopDuration,
    8000
  );

  const style: any = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  if (introEffect) {
    style["--intro-src"] = `url(${introEffect.src})`;
    style.backgroundImage = `url(${introEffect.src})`;
  }

  if (loopEffect) {
    style["--loop-src"] = `url(${loopEffect.src})`;
  }

  style.animation = `profile-effect ${totalDuration}ms infinite`;
  style.animationDelay = introEffect ? `${introEffect.start}ms` : "0ms";
  style.animationFillMode = "forwards";

  return style;
});
</script>

<template>
  <div class="channel-page flex h-full bg-dar k-800">
    <!-- Main Chat Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300 min-w-0"
      :class="{
        'mr-[320px]': isOpenUserProfile,
      }"
    >
      <!-- DM Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-3">
          <!-- Avatar with effect -->
          <div class="relative flex-shrink-0">
            <UAvatar :src="displayAvatar!" :alt="displayName" size="lg" />
            <!-- Avatar Effect Overlay -->
            <img
              v-if="getAvatarEffectUrl()"
              :src="getAvatarEffectUrl() || ''"
              alt="Avatar Effect"
              class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </div>
          <div class="flex flex-col">
            <h1 class="text-white font-semibold truncate">
              {{ displayName }}
            </h1>
            <span class="text-xs text-gray-400">
              {{
                currentChannel?.type === ChannelType.GROUP_DM
                  ? "Group Chat"
                  : "Direct Message"
              }}
            </span>
          </div>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            variant="ghost"
            @click="toggleUserProfile"
          >
            <UIcon name="i-lucide-user" class="w-5 h-5" />
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
            <!-- Avatar with effect -->
            <div class="relative mr-3">
              <UAvatar :src="displayAvatar!" :alt="displayName" size="lg" />
              <!-- Avatar Effect Overlay -->
              <img
                v-if="getAvatarEffectUrl()"
                :src="getAvatarEffectUrl() || ''"
                alt="Avatar Effect"
                class="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>
          </div>
          <h2 class="text-white text-xl font-bold">
            {{
              currentChannel?.type === ChannelType.GROUP_DM
                ? `Chào mừng đến với ${displayName}`
                : `Đây là cuộc trò chuyện với ${displayName}`
            }}
          </h2>
          <p class="text-[#72767d] text-base mb-4">
            {{
              currentChannel?.type === ChannelType.GROUP_DM
                ? "Đây là nơi bắt đầu cuộc trò chuyện nhóm của bạn."
                : `Đây là nơi bắt đầu cuộc trò chuyện trực tiếp của bạn với ${displayName}.`
            }}
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
            'max-w-full': !isOpenUserProfile,
            'max-w-4xl mx-auto': isOpenUserProfile,
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

    <!-- User Profile Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenUserProfile && dmRecipient"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 overflow-hidden z-50"
      >
        <!-- Profile Effect Overlay (full panel background) -->
        <div
          v-if="currentProfileEffect"
          class="absolute inset-0 w-full h-full pointer-events-none z-0"
          :style="profileEffectStyle"
        ></div>

        <!-- Content with relative positioning and scroll -->
        <div class="relative z-10 h-full overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-white font-semibold flex items-center text-lg">
              <UIcon name="i-lucide-user" class="w-5 h-5 mr-2" />
              User Profile
            </h3>
            <UButton
              @click="closeUserProfile"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>

          <!-- User Profile Content -->
          <div class="space-y-4">
            <!-- User Avatar and Basic Info -->
            <div
              class="flex flex-col items-center text-center p-4 bg-dark-700/50 backdrop-blur-sm rounded-lg relative overflow-hidden"
            >
              <!-- Avatar with decoration -->
              <div class="relative mb-3">
                <UAvatar
                  :src="dmRecipient?.avatar!"
                  :alt="getUserDisplayName(dmRecipient)"
                  size="3xl"
                />
                <!-- Avatar Effect Overlay -->
                <img
                  v-if="getAvatarEffectUrl()"
                  :src="getAvatarEffectUrl() || ''"
                  alt="Avatar Effect"
                  class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              </div>

              <h4 class="text-white font-semibold text-lg">
                {{ getUserDisplayName(dmRecipient) }}
              </h4>
              <p class="text-gray-400 text-sm">@{{ dmRecipient?.username }}</p>
            </div>

            <!-- Quick Actions -->
            <div class="space-y-2">
              <UButton
                v-if="!isFriend"
                color="neutral"
                variant="soft"
                block
                icon="i-lucide-user-plus"
              >
                Add Friend
              </UButton>
            </div>

            <!-- Additional Info -->
            <div class="space-y-3">
              <div class="bg-dark-700/50 backdrop-blur-sm p-3 rounded-lg">
                <h5 class="text-white font-medium mb-2">About</h5>
                <p v-if="userRecipient?.bio" class="text-gray-400 text-sm">
                  {{ userRecipient.bio }}.
                </p>
                <p v-else class="text-gray-400 text-sm">No bio available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@keyframes profile-effect {
  0% {
    background-image: var(--intro-src);
  }
  37.5% {
    background-image: var(--intro-src);
  }
  37.6% {
    background-image: var(--loop-src);
  }
  100% {
    background-image: var(--loop-src);
  }
}
</style>
