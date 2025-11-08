<script setup lang="ts">
import { useVoiceChannelLiveKit } from "~/composables/useVoiceChannelLiveKit";
import { useCommunityVoice } from "~/composables/useCommunityVoice";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useChannelStore } from "~/stores/channels/channel.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { joinRoom } from "~/stores/websocket/websocket.action";

const authStore = useAuthStore();
const user = authStore.user;

const webSocketStore = useWebSocketStore();

const { fetchCommunityVoiceParticipants, voiceParticipantsByChannel } =
  useCommunityVoice();

const getAvatarEffectUrl = computed(() => {
  return (author: any) => {
    if (!author?.avatarEffectId) return null;

    const effect = authStore.decoration?.find(
      (d: any) => d.id === author.avatarEffectId
    );

    if (!effect) {
      authStore.fetchAvatarDecorationById(author.avatarEffectId);
      return null;
    }

    return effect?.metadata?.link || effect?.metadata?.image || null;
  };
});

const {
  init,
  leave,
  localStream,
  localScreenTrack,
  remoteStreams,
  remoteScreenStreams,
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  usersInfo,
  toggleVideo,
  toggleAudio,
  toggleScreenShare,
  isConnected,
  isConnecting,
} = useVoiceChannelLiveKit();

const localVideo = ref<HTMLVideoElement | null>(null);
const localScreenVideo = ref<HTMLVideoElement | null>(null);
const remoteVideoRefs = ref<{ [key: string]: HTMLVideoElement }>({});
const remoteScreenRefs = ref<{ [key: string]: HTMLVideoElement }>({});

const pinnedScreen = ref<string | null>(null);

const { currentChannel } = storeToRefs(useChannelStore());
const { currentCommunity } = storeToRefs(useCommunityStore());
const channelId = currentChannel.value?.id as string;

const participantsInChannel = computed(() => {
  return voiceParticipantsByChannel.value[channelId] || [];
});

async function startCall() {
  if (!isConnected.value && !isConnecting.value) {
    try {
      await init(channelId);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  }
}

onMounted(() => {
  joinRoom(`channel_${channelId}`);

  if (currentCommunity.value?.id) {
    fetchCommunityVoiceParticipants(currentCommunity.value.id);
  }

  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value;
  }

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isConnected.value) {
      const socket = webSocketStore.connection;
      if (socket?.connected) {
        socket.emit("leave_voice_channel", {
          channelId,
        });
      }
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });
});

onUnmounted(async () => {
  // Leave voice channel if connected
  if (isConnected.value) {
    await leave(channelId);

    if (currentCommunity.value?.id) {
      fetchCommunityVoiceParticipants(currentCommunity.value.id);
    }
  }
});

watch(localStream, (newStream) => {
  if (localVideo.value && newStream) {
    localVideo.value.srcObject = newStream;
  }
});

watch(isScreenSharing, (isSharing) => {
  if (!isSharing) {
    if (pinnedScreen.value === "local-screen") {
      pinnedScreen.value = null;
    }
  }
});

// Watch for local screen track changes and attach to video element
watch(
  localScreenTrack,
  (newTrack) => {
    if (newTrack) {
      nextTick(() => {
        if (localScreenVideo.value) {
          const stream = new MediaStream([newTrack.mediaStreamTrack]);
          localScreenVideo.value.srcObject = stream;

          localScreenVideo.value.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("⚠️ Local screen video play error:", err);
            }
          });
        } else {
          console.warn("⚠️ localScreenVideo ref not found");
        }
      });
    } else if (localScreenVideo.value) {
      // Clear when stopped
      localScreenVideo.value.srcObject = null;
    }
  },
  { immediate: true }
);

const localScreenStream = computed(() => {
  if (isScreenSharing.value && localScreenVideo.value) {
    return localScreenVideo.value.srcObject as MediaStream | null;
  }
  return null;
});

watch(
  remoteStreams,
  (newStreams) => {
    nextTick(() => {
      Object.entries(newStreams).forEach(([participantId, stream]) => {
        const videoEl = remoteVideoRefs.value[participantId];

        if (videoEl) {
          videoEl.srcObject = null;
          setTimeout(() => {
            videoEl.srcObject = stream;

            videoEl.autoplay = true;
            videoEl.playsInline = true;

            videoEl
              .play()
              .then(() => {})
              .catch((err) => {
                if (err.name !== "AbortError") {
                  console.warn("⚠️ Video play error:", err);
                }
              });
          }, 10);

          // Monitor video tracks for unmute events
          stream.getVideoTracks().forEach((track) => {
            if (track.muted) {
              const onUnmute = () => {
                track.removeEventListener("unmute", onUnmute);

                // Force complete refresh
                videoEl.srcObject = null;
                setTimeout(() => {
                  videoEl.srcObject = stream;
                  videoEl
                    .play()

                    .catch((err) =>
                      console.warn("⚠️ Video play error after unmute:", err)
                    );
                }, 50);
              };

              track.addEventListener("unmute", onUnmute);

              setTimeout(() => {
                track.removeEventListener("unmute", onUnmute);
              }, 10000);
            } else {
              `✅ Video track is NOT muted for ${participantId}`;
            }
          });
        } else {
          console.warn(
            `⚠️ No video element found for participant ${participantId}`
          );
        }
      });
    });
  },
  { deep: true }
);

watch(
  remoteScreenStreams,
  (newStreams, oldStreams) => {
    if (oldStreams) {
      Object.keys(oldStreams).forEach((id) => {
        if (!newStreams[id] && pinnedScreen.value === `screen-${id}`) {
          pinnedScreen.value = null;
        }
      });
    }

    nextTick(() => {
      Object.entries(newStreams).forEach(([participantId, stream]) => {
        const videoEl = remoteScreenRefs.value[participantId];
        if (videoEl && stream) {
          videoEl.srcObject = stream;
          videoEl.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("⚠️ Screen video play error:", err);
            }
          });
        }
      });
    });
  },
  { deep: true }
);

async function handleLeave(channelId: string) {
  await leave(channelId);
}

function togglePinScreen(screenId: string) {
  if (pinnedScreen.value === screenId) {
    pinnedScreen.value = null;
  } else {
    pinnedScreen.value = screenId;
  }
}

// Function to set remote video ref
function setRemoteVideoRef(participantId: string) {
  return (el: any) => {
    if (el) {
      remoteVideoRefs.value[participantId] = el as HTMLVideoElement;
    }
  };
}

// Function to set remote screen share video ref
function setRemoteScreenRef(participantId: string) {
  return (el: any) => {
    if (el) {
      remoteScreenRefs.value[participantId] = el as HTMLVideoElement;
    }
  };
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
      <!-- Loading state -->
      <div v-if="isConnecting" class="text-center text-white">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"
        ></div>
        <p class="text-lg">Đang kết nối...</p>
      </div>

      <!-- Connected: Videos grid -->
      <div v-else-if="isConnected" class="flex flex-col gap-5 w-full max-w-7xl">
        <!-- Videos grid -->
        <div
          class="grid gap-5 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
        >
          <!-- Local video -->
          <div
            :class="[
              'relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300',
              pinnedScreen === 'local-video'
                ? 'col-span-full row-span-2 h-[60vh]'
                : 'aspect-video hover:scale-105 hover:shadow-2xl',
            ]"
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
              class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-20"
              >You</span
            >
          </div>

          <!-- Remote videos -->
          <div
            v-for="(stream, id) in remoteStreams"
            :key="id"
            :class="[
              'relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300',
              pinnedScreen === `video-${id}`
                ? 'col-span-full row-span-2 h-[60vh]'
                : 'aspect-video hover:scale-105 hover:shadow-2xl',
            ]"
          >
            <!-- Video với proper ref và attributes -->
            <video
              :ref="setRemoteVideoRef(id as string)"
              autoplay
              playsinline
              :muted="false"
              width="1280"
              height="720"
              :class="[
                'w-full h-full object-cover',
                {
                  'opacity-0': !usersInfo[id]?.isVideoEnabled,
                  'z-0': !usersInfo[id]?.isVideoEnabled,
                },
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

          <!-- Local screen share -->
          <div
            v-if="isScreenSharing"
            :class="[
              'relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer group transition-all duration-300',
              pinnedScreen === 'local-screen'
                ? 'col-span-full row-span-2 h-[60vh]'
                : 'aspect-video hover:scale-105 hover:shadow-2xl',
            ]"
            @click="togglePinScreen('local-screen')"
          >
            <video
              ref="localScreenVideo"
              autoplay
              muted
              class="w-full h-full object-contain"
            ></video>
            <div
              class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded flex items-center gap-2 z-20"
            >
              <UIcon name="i-lucide-monitor" class="w-4 h-4 text-green-500" />
              <span class="text-sm">Your Screen</span>
            </div>
            <!-- Pin/Unpin button overlay on hover -->
            <div
              v-if="pinnedScreen !== 'local-screen'"
              class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div class="bg-black/60 p-3 rounded-full">
                <UIcon name="i-lucide-pin" class="w-6 h-6 text-white" />
              </div>
            </div>
            <!-- Unpin button when pinned -->
            <button
              v-if="pinnedScreen === 'local-screen'"
              @click.stop="togglePinScreen('local-screen')"
              class="absolute top-3 right-3 bg-black/70 hover:bg-black/90 p-2.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-20"
            >
              <UIcon name="i-lucide-pin-off" class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Remote screen shares -->
          <div
            v-for="(stream, id) in remoteScreenStreams"
            :key="`screen-${id}`"
            :class="[
              'relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer group transition-all duration-300',
              pinnedScreen === `screen-${id}`
                ? 'col-span-full row-span-2 h-[60vh]'
                : 'aspect-video hover:scale-105 hover:shadow-2xl',
            ]"
            @click="togglePinScreen(`screen-${id}`)"
          >
            <video
              :ref="setRemoteScreenRef(id as string)"
              autoplay
              playsinline
              :muted="false"
              class="w-full h-full object-contain"
            ></video>
            <div
              class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded flex items-center gap-2 z-20"
            >
              <UIcon name="i-lucide-monitor" class="w-4 h-4 text-blue-400" />
              <span class="text-sm"
                >{{ usersInfo[id]?.username || "Unknown" }}'s Screen</span
              >
            </div>
            <!-- Pin button overlay on hover -->
            <div
              v-if="pinnedScreen !== `screen-${id}`"
              class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div class="bg-black/60 p-3 rounded-full">
                <UIcon name="i-lucide-pin" class="w-6 h-6 text-white" />
              </div>
            </div>
            <!-- Unpin button when pinned -->
            <button
              v-if="pinnedScreen === `screen-${id}`"
              @click.stop="togglePinScreen(`screen-${id}`)"
              class="absolute top-3 right-3 bg-black/70 hover:bg-black/90 p-2.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-20"
            >
              <UIcon name="i-lucide-pin-off" class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Start Call Button -->
      <div
        v-else-if="!isConnected && !isConnecting"
        class="text-center text-gray-300"
      >
        <h2 class="text-white text-xl mb-2">{{ currentChannel?.name }}</h2>
        <div v-if="participantsInChannel.length > 0" class="mb-4">
          <p class="text-gray-100 mb-2">
            Hiện tại có {{ participantsInChannel.length }} người trong kênh
            thoại:
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <div
              v-for="participant in participantsInChannel"
              :key="participant.participantId"
              class="flex flex-col items-center"
            >
              <div class="relative">
                <UAvatar
                  :src="participant.avatar || ''"
                  :alt="participant.username || 'User'"
                  size="md"
                  class="border-2 border-gray-600"
                />
                <img
                  v-if="getAvatarEffectUrl(participant)"
                  :src="getAvatarEffectUrl(participant)"
                  alt="avatar-effect"
                  class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
                />
              </div>
              <span class="text-xs text-gray-300 mt-1">{{
                participant.username
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
      v-if="isConnected"
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
        @click="toggleVideo"
      >
        <UIcon
          :name="isVideoEnabled ? 'i-lucide-video-off' : 'i-lucide-camera'"
        />
      </UButton>
      <UButton
        :class="[
          'rounded-full w-12 h-12 flex items-center justify-center transition-colors',
          isScreenSharing
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-700 hover:bg-gray-600',
        ]"
        @click="toggleScreenShare"
      >
        <UIcon
          :name="isScreenSharing ? 'i-lucide-monitor-stop' : 'i-lucide-monitor'"
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
