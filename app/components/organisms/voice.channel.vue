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
const showThumbnailsWhenPinned = ref<boolean>(true); // Show/hide thumbnails when pinned

const { currentChannel } = storeToRefs(useChannelStore());
const { currentCommunity } = storeToRefs(useCommunityStore());
const channelId = currentChannel.value?.id as string;

const participantsInChannel = computed(() => {
  return voiceParticipantsByChannel.value[channelId] || [];
});

// Calculate grid layout based on number of items
const getGridClass = () => {
  let totalItems = 1; // Local video
  totalItems += Object.keys(remoteStreams.value).length; // Remote videos
  if (isScreenSharing.value) totalItems++; // Local screen
  totalItems += Object.keys(remoteScreenStreams.value).length; // Remote screens

  // Remove pinned item from count
  if (pinnedScreen.value) totalItems--;

  // Limit size for 1-2 people with max-width constraint, centered
  if (totalItems === 1)
    return "grid-cols-1 place-items-center max-w-md mx-auto";
  if (totalItems === 2)
    return "grid-cols-2 gap-5 max-w-3xl mx-auto place-items-center";
  // 3 people: 2 rows (2 on top, 1 on bottom centered)
  if (totalItems === 3) return "grid-cols-2 gap-3 auto-rows-fr";
  // 4 people: 2x2 grid
  if (totalItems === 4) return "grid-cols-2 gap-3 auto-rows-fr";
  // 5-6 people: 3x2 grid
  if (totalItems <= 6) return "grid-cols-3 gap-3 auto-rows-fr";
  // 7-9 people: 3x3 grid
  if (totalItems <= 9) return "grid-cols-3 gap-3 auto-rows-fr";
  // 10+ people: 4 columns
  return "grid-cols-4 gap-3 auto-rows-fr";
};

// Get total visible items count
const getTotalItems = () => {
  let totalItems = 1; // Local video
  totalItems += Object.keys(remoteStreams.value).length;
  if (isScreenSharing.value) totalItems++;
  totalItems += Object.keys(remoteScreenStreams.value).length;
  if (pinnedScreen.value) totalItems--;
  return totalItems;
};

// Get item class based on position (for centering 3rd item when total is 3)
const getItemClass = (
  isLocalVideo: boolean,
  remoteId?: string,
  isLocalScreen?: boolean,
  remoteScreenId?: string
) => {
  const totalItems = getTotalItems();

  // Calculate current index
  let index = 0;
  if (
    isLocalVideo &&
    (!pinnedScreen.value || pinnedScreen.value !== "local-video")
  ) {
    index = 0;
  } else if (remoteId) {
    index = 1; // Local video takes 0
    const remoteIds = Object.keys(remoteStreams.value);
    const remoteIndex = remoteIds.indexOf(remoteId);
    if (remoteIndex >= 0) {
      index += remoteIndex;
    }
  } else if (isLocalScreen) {
    index = 1 + Object.keys(remoteStreams.value).length;
  } else if (remoteScreenId) {
    index = 1 + Object.keys(remoteStreams.value).length;
    if (isScreenSharing.value) index += 1;
    const remoteScreenIds = Object.keys(remoteScreenStreams.value);
    const screenIndex = remoteScreenIds.indexOf(remoteScreenId);
    if (screenIndex >= 0) {
      index += screenIndex;
    }
  }

  const baseClass = getGridClass().includes("max-w")
    ? "w-full aspect-video"
    : "w-full h-full";

  // For 3 items, make the 3rd item (index 2) span 2 columns and center it
  if (totalItems === 3 && index === 2) {
    return `${baseClass} col-span-2 max-w-md mx-auto`;
  }

  return baseClass;
};

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
watchEffect(() => {
  if (localScreenTrack.value && localScreenVideo.value) {
    nextTick(() => {
      if (localScreenVideo.value && localScreenTrack.value) {
        const stream = new MediaStream([
          localScreenTrack.value.mediaStreamTrack,
        ]);
        localScreenVideo.value.srcObject = stream;

        // Force video properties
        localScreenVideo.value.autoplay = true;
        localScreenVideo.value.muted = true;
        localScreenVideo.value.playsInline = true;

        localScreenVideo.value.play().catch(() => {});
      }
    });
  } else if (localScreenVideo.value && !localScreenTrack.value) {
    localScreenVideo.value.srcObject = null;
  }
});

// Re-attach stream when pinning/unpinning local screen
watch(
  () => pinnedScreen.value,
  () => {
    if (
      localScreenTrack.value &&
      (pinnedScreen.value === "local-screen" || isScreenSharing.value)
    ) {
      nextTick(() => {
        if (localScreenVideo.value) {
          const stream = new MediaStream([
            localScreenTrack.value!.mediaStreamTrack,
          ]);
          localScreenVideo.value.srcObject = stream;
          localScreenVideo.value.play().catch(() => {});
        }
      });
    }
  }
);

// Re-attach remote screen stream when pinning/unpinning remote screen
watch(
  () => pinnedScreen.value,
  () => {
    if (pinnedScreen.value && pinnedScreen.value.startsWith("screen-")) {
      const participantId = pinnedScreen.value.replace("screen-", "");
      const stream = remoteScreenStreams.value[participantId];
      const videoEl = remoteScreenRefs.value[participantId];

      if (stream && videoEl) {
        nextTick(() => {
          videoEl.srcObject = stream;
          videoEl.play().catch(() => {});
        });
      }
    }
  }
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

// Automatically attach remote screen streams when refs or streams change
watchEffect(() => {
  Object.entries(remoteScreenStreams.value).forEach(
    ([participantId, stream]) => {
      const videoEl = remoteScreenRefs.value[participantId];
      if (
        videoEl &&
        stream &&
        (!videoEl.srcObject || videoEl.srcObject !== stream)
      ) {
        nextTick(() => {
          if (videoEl && stream) {
            videoEl.srcObject = stream;
            videoEl.play().catch(() => {});
          }
        });
      }
    }
  );
});

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

// Function to set remote screen ref for pinned screen
function setPinnedRemoteScreenRef(el: any) {
  if (el && pinnedScreen.value && pinnedScreen.value.startsWith("screen-")) {
    const participantId = pinnedScreen.value.replace("screen-", "");
    const stream = remoteScreenStreams.value[participantId];
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
    remoteScreenRefs.value[participantId] = el as HTMLVideoElement;
  }
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
      class="relative flex-1 bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center p-5 overflow-hidden"
    >
      <!-- Loading state -->
      <div v-if="isConnecting" class="text-center text-white">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"
        ></div>
        <p class="text-lg">Đang kết nối...</p>
      </div>

      <!-- Connected: Videos layout -->
      <div v-else-if="isConnected" class="flex flex-col w-full h-full">
        <!-- When something is pinned: Show pinned screen + thumbnails -->
        <div v-if="pinnedScreen" class="flex flex-col w-full h-full">
          <!-- Pinned screen (full width on top) -->
          <div
            class="w-full flex-1 bg-gray-900 rounded-lg overflow-hidden relative group mb-4"
          >
            <!-- Local video pinned -->
            <video
              v-if="pinnedScreen === 'local-video'"
              ref="localVideo"
              autoplay
              muted
              :class="[
                'w-full h-full scale-x-[-1]',
                isVideoEnabled ? 'object-cover' : 'hidden',
              ]"
            ></video>
            <div
              v-if="pinnedScreen === 'local-video' && !isVideoEnabled"
              class="absolute inset-0 flex items-center justify-center bg-gray-700"
            >
              <div class="relative">
                <UAvatar
                  :src="user?.avatar || ''"
                  :alt="user?.username || 'User Avatar'"
                  size="3xl"
                  class="border-4 border-gray-600"
                />
                <img
                  v-if="getAvatarEffectUrl(user)"
                  :src="getAvatarEffectUrl(user)"
                  alt="avatar-effect"
                  class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
                />
              </div>
            </div>

            <!-- Remote video pinned -->
            <video
              v-else-if="pinnedScreen && pinnedScreen.startsWith('video-')"
              :ref="setRemoteVideoRef(pinnedScreen.replace('video-', ''))"
              autoplay
              playsinline
              :muted="false"
              :class="[
                'w-full h-full object-cover',
                {
                  hidden:
                    !usersInfo[pinnedScreen.replace('video-', '')]
                      ?.isVideoEnabled,
                },
              ]"
            ></video>
            <div
              v-if="
                pinnedScreen &&
                pinnedScreen.startsWith('video-') &&
                !usersInfo[pinnedScreen.replace('video-', '')]?.isVideoEnabled
              "
              class="absolute inset-0 flex items-center justify-center bg-gray-700"
            >
              <div class="relative">
                <UAvatar
                  :src="
                    usersInfo[pinnedScreen.replace('video-', '')]?.avatar || ''
                  "
                  :alt="
                    usersInfo[pinnedScreen.replace('video-', '')]?.username ||
                    'Remote User'
                  "
                  size="3xl"
                  class="border-4 border-gray-600"
                />
                <img
                  v-if="
                    getAvatarEffectUrl(
                      usersInfo[pinnedScreen.replace('video-', '')]
                    )
                  "
                  :src="
                    getAvatarEffectUrl(
                      usersInfo[pinnedScreen.replace('video-', '')]
                    )
                  "
                  alt="avatar-effect"
                  class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full"
                />
              </div>
            </div>

            <!-- Local screen pinned -->
            <video
              v-else-if="pinnedScreen === 'local-screen'"
              :ref="(el) => { if (el) localScreenVideo = el as HTMLVideoElement }"
              autoplay
              muted
              playsinline
              class="w-full h-full object-cover bg-black"
            ></video>

            <!-- Remote screen pinned -->
            <video
              v-else-if="pinnedScreen && pinnedScreen.startsWith('screen-')"
              :ref="setPinnedRemoteScreenRef"
              autoplay
              playsinline
              :muted="false"
              class="w-full h-full object-cover bg-black"
            ></video>

            <!-- Unpin button only -->
            <button
              @click="togglePinScreen(pinnedScreen)"
              class="absolute top-3 right-3 bg-black/70 hover:bg-black/90 p-2.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-20"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Bottom section: Video grid with slide animation -->
          <div
            class="flex-shrink-0 relative transition-all duration-300 overflow-visible"
            :class="showThumbnailsWhenPinned ? 'h-32' : 'h-0'"
          >
            <!-- Grid layout for videos -->
            <div
              class="grid gap-2 w-full h-full px-5 py-2 grid-cols-6 auto-rows-fr"
            >
              <!-- Local video -->
              <div
                v-if="!pinnedScreen || pinnedScreen !== 'local-video'"
                class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full"
                @click="togglePinScreen('local-video')"
              >
                <video
                  ref="localVideo"
                  autoplay
                  muted
                  :class="[
                    'w-full h-full object-cover scale-x-[-1]',
                    { 'opacity-0': !isVideoEnabled },
                  ]"
                ></video>
                <div
                  v-if="!isVideoEnabled"
                  class="absolute inset-0 flex items-center justify-center bg-gray-700"
                >
                  <div class="relative">
                    <UAvatar
                      :src="user?.avatar || ''"
                      :alt="user?.username || 'User Avatar'"
                      size="sm"
                      class="border-2 border-gray-600"
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
                  class="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] z-20"
                  >You</span
                >
              </div>

              <!-- Remote videos -->
              <div
                v-for="(stream, id) in remoteStreams"
                :key="id"
                v-show="!pinnedScreen || pinnedScreen !== `video-${id}`"
                class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full"
                @click="togglePinScreen(`video-${id}`)"
              >
                <video
                  :ref="setRemoteVideoRef(id as string)"
                  autoplay
                  playsinline
                  :muted="false"
                  :class="[
                    'w-full h-full object-cover',
                    {
                      'opacity-0': !usersInfo[id]?.isVideoEnabled,
                      'z-0': !usersInfo[id]?.isVideoEnabled,
                    },
                  ]"
                ></video>
                <div
                  v-if="!usersInfo[id]?.isVideoEnabled"
                  class="absolute inset-0 flex items-center justify-center bg-gray-700 z-10"
                >
                  <div class="relative">
                    <UAvatar
                      :src="usersInfo[id]?.avatar || ''"
                      :alt="usersInfo[id]?.username || 'Remote User'"
                      size="sm"
                      class="border-2 border-gray-600"
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
                  class="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] z-20"
                  >{{ usersInfo[id]?.username || "Unknown" }}</span
                >
              </div>

              <!-- local screen stream -->
              <div
                v-if="
                  isScreenSharing &&
                  (!pinnedScreen || pinnedScreen !== 'local-screen')
                "
                class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full"
                @click="togglePinScreen('local-screen')"
              >
                <video
                  :ref="(el) => { if (el) localScreenVideo = el as HTMLVideoElement }"
                  autoplay
                  muted
                  playsinline
                  class="w-full h-full object-cover bg-black"
                ></video>
                <div
                  class="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1 z-20"
                >
                  <UIcon
                    name="i-lucide-monitor"
                    class="w-2.5 h-2.5 text-green-500"
                  />
                  <span class="text-[10px]">Your Screen</span>
                </div>
              </div>

              <!-- Remote screen shares -->
              <div
                v-for="(stream, id) in remoteScreenStreams"
                :key="`screen-${id}`"
                v-show="!pinnedScreen || pinnedScreen !== `screen-${id}`"
                class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full"
                @click="togglePinScreen(`screen-${id}`)"
              >
                <video
                  :ref="setRemoteScreenRef(id as string)"
                  autoplay
                  playsinline
                  :muted="false"
                  class="w-full h-full object-cover bg-black"
                ></video>
                <div
                  class="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1 z-20"
                >
                  <UIcon
                    name="i-lucide-monitor"
                    class="w-2.5 h-2.5 text-blue-400"
                  />
                  <span class="text-[10px]"
                    >{{ usersInfo[id]?.username || "Unknown" }}'s Screen</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom section when NOT pinned -->
        <div v-else class="flex-1 flex items-center justify-center">
          <!-- Grid layout for videos -->
          <div class="grid gap-3 w-full h-full px-5" :class="getGridClass()">
            <!-- Local video -->
            <div
              v-if="!pinnedScreen || pinnedScreen !== 'local-video'"
              class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
              :class="getItemClass(true)"
              @click="togglePinScreen('local-video')"
            >
              <video
                ref="localVideo"
                autoplay
                muted
                :class="[
                  'w-full h-full object-cover scale-x-[-1]',
                  { 'opacity-0': !isVideoEnabled },
                ]"
              ></video>
              <div
                v-if="!isVideoEnabled"
                class="absolute inset-0 flex items-center justify-center bg-gray-700"
              >
                <div class="relative">
                  <UAvatar
                    :src="user?.avatar || ''"
                    :alt="user?.username || 'User Avatar'"
                    size="2xl"
                    class="border-4 border-gray-600"
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
                class="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-20"
                >You</span
              >
            </div>

            <!-- Remote videos -->
            <div
              v-for="(stream, id) in remoteStreams"
              :key="id"
              v-show="!pinnedScreen || pinnedScreen !== `video-${id}`"
              class="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
              :class="getItemClass(false, id as string)"
              @click="togglePinScreen(`video-${id}`)"
            >
              <video
                :ref="setRemoteVideoRef(id as string)"
                autoplay
                playsinline
                :muted="false"
                :class="[
                  'w-full h-full object-cover',
                  {
                    'opacity-0': !usersInfo[id]?.isVideoEnabled,
                    'z-0': !usersInfo[id]?.isVideoEnabled,
                  },
                ]"
              ></video>
              <div
                v-if="!usersInfo[id]?.isVideoEnabled"
                class="absolute inset-0 flex items-center justify-center bg-gray-700 z-10"
              >
                <div class="relative">
                  <UAvatar
                    :src="usersInfo[id]?.avatar || ''"
                    :alt="usersInfo[id]?.username || 'Remote User'"
                    size="2xl"
                    class="border-4 border-gray-600"
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
                class="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-20"
                >{{ usersInfo[id]?.username || "Unknown" }}</span
              >
            </div>

            <!-- Local screen share -->
            <div
              v-if="
                isScreenSharing &&
                (!pinnedScreen || pinnedScreen !== 'local-screen') &&
                (!pinnedScreen || !pinnedScreen.startsWith('video-'))
              "
              class="relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
              :class="getItemClass(false, undefined, true)"
              @click="togglePinScreen('local-screen')"
            >
              <video
                :ref="(el) => { if (el) localScreenVideo = el as HTMLVideoElement }"
                autoplay
                muted
                playsinline
                class="w-full h-full object-cover bg-black"
              ></video>
              <div
                class="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1 z-20"
              >
                <UIcon
                  name="i-lucide-monitor"
                  class="w-2.5 h-2.5 text-green-500"
                />
                <span class="text-[10px]">Your Screen</span>
              </div>
            </div>

            <!-- Remote screen shares -->
            <div
              v-for="(stream, id) in remoteScreenStreams"
              :key="`screen-${id}`"
              v-show="
                !pinnedScreen ||
                (pinnedScreen !== `screen-${id}` &&
                  !pinnedScreen.startsWith('video-'))
              "
              class="relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
              :class="getItemClass(false, undefined, false, id as string)"
              @click="togglePinScreen(`screen-${id}`)"
            >
              <video
                :ref="setRemoteScreenRef(id as string)"
                autoplay
                playsinline
                :muted="false"
                class="w-full h-full object-cover bg-black"
              ></video>
              <div
                class="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1 z-20"
              >
                <UIcon
                  name="i-lucide-monitor"
                  class="w-2.5 h-2.5 text-blue-400"
                />
                <span class="text-[10px]"
                  >{{ usersInfo[id]?.username || "Unknown" }}'s Screen</span
                >
              </div>
            </div>
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

    <!-- Toggle button (always visible, floats above controls) -->
    <button
      v-if="isConnected && pinnedScreen"
      @click="showThumbnailsWhenPinned = !showThumbnailsWhenPinned"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors z-50 flex items-center gap-2 px-4 shadow-lg ml-40"
    >
      <UIcon
        :name="
          showThumbnailsWhenPinned
            ? 'i-lucide-chevron-down'
            : 'i-lucide-chevron-up'
        "
        class="w-4 h-4 text-white"
      />
      <span class="text-white text-xs font-medium">
        {{ showThumbnailsWhenPinned ? "Ẩn" : "Hiện" }}
      </span>
    </button>

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
