<script setup lang="ts">
import { useVoiceChannel } from "~/composables/useVoiceChannel";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import { joinRoom } from "~/stores/websocket/websocket.action";

const authStore = useAuthStore();
const user = authStore.user;

const getAvatarEffectUrl = (author: any) => {
  if (!author?.avatarEffectId) return null;
  const effect = authStore.decoration?.find(
    (d: any) => d.id === author.avatarEffectId
  );
  if (!effect) {
    authStore.fetchAvatarDecorationById(author.avatarEffectId);
  }
  return effect?.metadata?.link || effect?.metadata?.image || null;
};
const {
  init,
  leave,
  localStream,
  remoteStreams,
  isVideoEnabled,
  isAudioEnabled,
  usersInfo,
  usersInRoom,
  toggleVideo,
  toggleAudio,
  getRoomUsers,
} = useVoiceChannel();

const localVideo = ref<HTMLVideoElement | null>(null);
const isInited = ref(false);

const route = useRoute();
const { currentChannel } = storeToRefs(useChannelStore());
const channelId = currentChannel.value?.id as string;

function startCall() {
  if (!isInited.value) {
    init(channelId);
    isInited.value = true;
  }
}

onMounted(() => {
  joinRoom(`channel_${channelId}`);
  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value;
  }
  if (channelId) {
    getRoomUsers(`channel_${channelId}_init`);
  }
});

// Watch for localStream changes
watch(localStream, (newStream) => {
  if (localVideo.value && newStream) {
    localVideo.value.srcObject = newStream;
  }
});

function handleLeave(channelId: string) {
  leave(channelId);
  isInited.value = false;
}
</script>

<template>
  <div class="w-full h-screen flex flex-col">
    <!-- header -->
    <div class="header mt-1">
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-hash" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3"></div>
      </div>
    </div>

    <!-- video call container -->
    <div
      class="relative min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center p-5"
    >
      <!-- Videos grid -->
      <div
        v-if="isInited"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-6xl"
      >
        <!-- Local video -->
        <div
          class="relative bg-gray-800 rounded-lg overflow-hidden aspect-video hover:scale-105 hover:shadow-2xl transition-transform duration-200"
        >
          <!-- Luôn render video, nhưng ẩn nếu tắt -->
          <video
            ref="localVideo"
            autoplay
            muted
            :class="[
              'w-full h-full object-cover scale-x-[-1]',
              { 'opacity-0': !isVideoEnabled }, // Ẩn video nếu tắt
            ]"
          ></video>
          <!-- Hiển thị avatar overlay nếu video tắt -->
          <div
            v-if="!isVideoEnabled"
            class="absolute inset-0 flex items-center justify-center bg-gray-700"
          >
            <div class="relative">
              <UAvatar
                :src="user?.avatar || ''"
                :alt="user?.username || 'User Avatar'"
                size="lg"
                class="border-4 border-gray-600 w-24 h-24 object-cover rounded-full"
              />
              <img
                v-if="getAvatarEffectUrl(user)"
                :src="getAvatarEffectUrl(user)"
                alt="avatar-effect"
                class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
              />
            </div>
          </div>
          <span
            class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"
            >You</span
          >
        </div>

        <!-- Remote videos -->
        <div
          v-for="(stream, id) in remoteStreams"
          :key="id"
          class="relative bg-gray-800 rounded-lg overflow-hidden aspect-video hover:scale-105 hover:shadow-2xl transition-transform duration-200"
        >
          <!-- Luôn render video với playsinline để đảm bảo autoplay, ẩn bằng opacity nhưng z-index thấp -->
          <video
            :srcObject="stream"
            autoplay
            playsinline
            :class="[
              'w-full h-full object-cover',
              {
                'opacity-0': !usersInfo[id]?.isVideoEnabled,
                'z-0': !usersInfo[id]?.isVideoEnabled,
              }, // Ẩn và đưa xuống dưới
            ]"
          ></video>
          <!-- Hiển thị avatar overlay nếu video tắt (z-index cao hơn) -->
          <div
            v-if="!usersInfo[id]?.isVideoEnabled"
            class="absolute inset-0 flex items-center justify-center bg-gray-700 z-10"
          >
            <div class="relative">
              <UAvatar
                :src="usersInfo[id]?.avatar || ''"
                :alt="usersInfo[id]?.username || 'Remote User'"
                size="lg"
                class="border-4 border-gray-600 w-24 h-24 object-cover rounded-full"
              />
              <img
                v-if="getAvatarEffectUrl(usersInfo[id])"
                :src="getAvatarEffectUrl(usersInfo[id])"
                alt="avatar-effect"
                class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
              />
            </div>
          </div>
          <span
            class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-20"
            >{{ usersInfo[id]?.username || "Unknown" }}</span
          >
        </div>
      </div>

      <!-- Start Call Button -->
      <div v-if="!isInited" class="text-center text-gray-300">
        <h2 class="text-white text-xl mb-2">{{ currentChannel?.name }}</h2>
        <div v-if="usersInRoom.length > 0" class="mb-4">
          <p class="text-gray-100 mb-2">
            Hiện tại có {{ usersInRoom.length }} người trong kênh thoại:
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <div
              v-for="userId in usersInRoom"
              :key="userId"
              class="flex flex-col items-center"
            >
              <div class="relative">
                <UAvatar
                  :src="usersInfo[userId]?.avatar || ''"
                  :alt="usersInfo[userId]?.username || 'User'"
                  size="md"
                  class="border-2 border-gray-600"
                />
                <img
                  v-if="getAvatarEffectUrl(usersInfo[userId])"
                  :src="getAvatarEffectUrl(usersInfo[userId])"
                  alt="avatar-effect"
                  class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
                />
              </div>
              <span class="text-xs text-gray-300 mt-1">{{
                usersInfo[userId]?.username
              }}</span>
            </div>
          </div>
        </div>
        <div v-else class="mb-4">
          <p class="text-gray-100">Hiện tại ko có ai ở trong kênh thoại.</p>
        </div>
        <UButton @click="startCall" color="neutral" class="h-10">
          Tham gia thoại
        </UButton>
      </div>
    </div>

    <!-- Controls bar -->
    <div
      v-if="isInited"
      class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex gap-3 justify-center items-center bg-opacity-50 px-4 py-2 rounded-full ml-40"
    >
      <UButton
        class="rounded-full w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-colors"
        @click="toggleAudio"
      >
        <UIcon :name="!isAudioEnabled ? 'i-lucide-mic-off' : 'i-lucide-mic'" />
      </UButton>
      <UButton
        class="rounded-full w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-colors"
        @click="toggleVideo(channelId)"
      >
        <UIcon
          :name="isVideoEnabled ? 'i-lucide-video-off' : 'i-lucide-camera'"
        />
      </UButton>
      <UButton
        class="rounded-full w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors"
        @click="handleLeave(channelId)"
      >
        <UIcon name="i-lucide-phone-off" />
      </UButton>
    </div>
  </div>
</template>
