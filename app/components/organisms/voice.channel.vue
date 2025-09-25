<script setup lang="ts">
import { useRoute } from "vue-router";
import { useMemberStore } from "~/stores/member/member.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Channel } from "~/stores/channels/channel.type";
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";

interface Props {
  channelId: string;
  currentChannel: Channel | null;
  isOpenSlideoverMember: boolean;
}

const props = defineProps<Props>();

const memberStore = useMemberStore();
const authStore = useAuthStore();
const route = useRoute();

// WebSocket / WebRTC state
const ws = useWebSocket();
const wsStore = useWebSocketStore();

const isInVoice = ref(false);
const localStream = ref<MediaStream | null>(null);
const peers = reactive<Record<string, RTCPeerConnection>>({});
const remoteStreams = reactive<Record<string, MediaStream>>({});
const remoteAudioElements = reactive<Record<string, HTMLAudioElement | null>>(
  {}
);
const connectedUsers = ref<any[]>([]); // array of user objects { socketId, id, username, avatar, banner }
const localAudioRef = ref<HTMLAudioElement | null>(null);

let listenersAttached = false;

const muted = ref(false);

const participants = computed(() => {
  const list: Array<any> = [];
  const mySocketId = wsStore.connection?.id || "me";

  // Local user entry
  // Local user entry: only show local tile when the user actually joined voice
  if (isInVoice.value && authStore.user) {
    list.push({
      socketId: String(mySocketId),
      id: authStore.user.id ?? (authStore.user as any)?.sub ?? null,
      username: authStore.user.username || "Bạn",
      avatar: authStore.user.avatar || null,
      banner: (authStore.user as any)?.banner ?? null,
      local: true,
    });
  }

  // Remote users from server (connectedUsers are objects)
  for (const u of connectedUsers.value) {
    const sid = String(u?.socketId ?? u?.id ?? u);
    if (!sid || sid === String(mySocketId)) continue;
    list.push({
      socketId: sid,
      id: u?.id ?? null,
      username: u?.username ?? u?.name ?? `User ${sid.slice(0, 6)}`,
      avatar: u?.avatar ?? null,
      banner: u?.banner ?? null,
      local: false,
    });
  }

  return list;
});

const socketDebugEvents = ref<
  Array<{ t: number; event: string; payload: any }>
>([]);
const showDebug = ref(false);

onMounted(() => {
  try {
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.search
    ) {
      showDebug.value = String(window.location.search).includes(
        "voice_debug=1"
      );
    }
  } catch (e) {
    showDebug.value = false;
  }
  // Attach listeners immediately if socket already connected and request current room users
  try {
    attachSocketListeners();
  } catch (e) {
    // ignore
  }
  // Try to request users for current channel on mount
  nextTick(() => {
    requestRoomUsers();
  });
});

const emit = defineEmits<{
  toggleMemberPanel: [];
  closeMemberPanel: [];
}>();

const toggleMemberPanel = () => emit("toggleMemberPanel");
const closeMemberPanel = () => emit("closeMemberPanel");

// Function to refresh members via WebSocket
const refreshMembers = async () => {
  const currentGuildId = route.params.guild_id as string;
  if (currentGuildId) {
    try {
      await memberStore.fetchMembersViaWebSocket(currentGuildId);
    } catch (error) {
      console.error("Failed to refresh members:", error);
    }
  }
};

// Helper: create RTCPeerConnection and hook events
function createPeer(remoteId: string, isInitiator = false) {
  if (peers[remoteId]) return peers[remoteId];

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Relay local tracks
  if (localStream.value) {
    for (const track of localStream.value.getTracks()) {
      pc.addTrack(track, localStream.value);
    }
  }

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      ws.sendMessage("signal", {
        type: "ice",
        payload: ev.candidate,
        to: remoteId,
      });
    }
  };

  pc.ontrack = (ev) => {
    // Combine tracks into a MediaStream
    const incomingStream =
      ev.streams && ev.streams[0]
        ? ev.streams[0]
        : new MediaStream(ev.track ? [ev.track] : []);
    remoteStreams[remoteId] = incomingStream;

    // If element for local preview exists, assign
    // (Template will bind srcObject via setRemoteAudio)
  };

  // When track arrives, try to attach to audio element if already rendered
  pc.ontrack = (ev) => {
    const incomingStream =
      ev.streams && ev.streams[0]
        ? ev.streams[0]
        : new MediaStream(ev.track ? [ev.track] : []);
    remoteStreams[remoteId] = incomingStream;

    // Assign to audio element if exists
    nextTick(() => {
      const el = remoteAudioElements[remoteId];
      if (el) {
        try {
          (el as HTMLAudioElement).srcObject = incomingStream;
        } catch (e) {
          console.warn("Failed to attach remote stream to audio element:", e);
        }
      }
    });
  };

  peers[remoteId] = pc;

  // If initiator, create offer
  if (isInitiator) {
    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.sendMessage("signal", {
          type: "offer",
          payload: offer,
          to: remoteId,
        });
      } catch (e) {
        console.error("Failed to create offer:", e);
      }
    })();
  }

  return pc;
}

async function startLocalAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.value = stream;
    if (localAudioRef.value) {
      localAudioRef.value.srcObject = stream;
    }
  } catch (e) {
    console.error("Failed to get local audio:", e);
  }
}

async function joinVoice() {
  if (!props.currentChannel && !props.channelId) return;
  const roomId = props.channelId || (props.currentChannel as any)?.id || "";
  if (!roomId) return;

  await startLocalAudio();

  // Attach socket listeners if not attached
  attachSocketListeners();

  // Notify server to join voice room
  // Ensure socket connected (short wait) and log state
  const waited = await waitForSocket(3000);
  console.debug("joinVoice: socket state", {
    connected: !!wsStore.connection,
    socketId: wsStore.connection?.id,
    waited,
  });

  try {
    const communityId =
      (route.params.guild_id as string) ||
      (props.currentChannel as any)?.guildId ||
      null;
    ws.sendMessage("join-room", { roomId, communityId });
    console.debug("joinVoice sent join-room", {
      roomId,
      communityId,
      socketId: wsStore.connection?.id,
    });
  } catch (e) {
    console.error("joinVoice: failed to send join-room", e);
  }
  // Ask server to return room users explicitly (some servers send via room-users on join, but request to be safe)
  try {
    ws.sendMessage("get-room-users", { roomId });
  } catch (e) {
    console.debug("get-room-users request failed:", e);
  }
  isInVoice.value = true;
}

// Wait up to `timeoutMs` for wsStore.connection to be available
function waitForSocket(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const iv = setInterval(() => {
      if (wsStore.connection) {
        clearInterval(iv);
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        resolve(false);
      }
    }, 100);
  });
}

function leaveVoice() {
  const roomId = props.channelId || (props.currentChannel as any)?.id || "";
  if (roomId && wsStore.isWebSocketConnected) {
    const communityId =
      (route.params.guild_id as string) ||
      (props.currentChannel as any)?.guildId ||
      null;
    ws.sendMessage("user-left", { roomId, communityId });
  }

  // Close all peers
  for (const id of Object.keys(peers)) {
    const pc = peers[id];
    if (pc) {
      try {
        pc.close();
      } catch {}
      delete peers[id];
    }
    if (remoteStreams[id]) delete remoteStreams[id];
  }

  // Stop local tracks
  if (localStream.value) {
    for (const t of localStream.value.getTracks()) t.stop();
    localStream.value = null;
  }

  connectedUsers.value = [];
  isInVoice.value = false;
  detachSocketListeners();
}

function toggleMute() {
  muted.value = !muted.value;
  if (!localStream.value) return;
  for (const t of localStream.value.getAudioTracks()) {
    try {
      t.enabled = !muted.value;
    } catch (e) {
      console.warn("Failed to toggle track enabled:", e);
    }
  }
}

function normalizeUsersPayload(payload: any): any[] {
  if (!payload) return [];
  // If payload is an array of objects (user objects), return as-is
  if (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === "object"
  )
    return payload;
  // If payload.users is array of objects
  if (
    payload.users &&
    Array.isArray(payload.users) &&
    payload.users.length > 0 &&
    typeof payload.users[0] === "object"
  )
    return payload.users;
  // Support several shapes of socket id arrays: return array of { socketId }
  if (Array.isArray(payload))
    return payload.map((s) => ({ socketId: String(s) }));
  if (payload.users && Array.isArray(payload.users))
    return payload.users.map((s: any) => ({ socketId: String(s) }));
  if (payload.sockets && Array.isArray(payload.sockets))
    return payload.sockets.map((s: any) => ({ socketId: String(s) }));
  if (payload instanceof Set)
    return Array.from(payload).map((s) => ({ socketId: String(s) }));
  // If payload is object map, try to return values as objects
  if (typeof payload === "object")
    return Object.values(payload).map((v: any) =>
      typeof v === "string" ? { socketId: String(v) } : v
    );
  return [];
}

function handleRoomUsers(payload: any) {
  console.debug("socket event: room-users", payload);
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: "room-users",
    payload,
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
  const users = normalizeUsersPayload(payload) as any[];
  const mySocketId = wsStore.connection?.id;

  // Map to user objects with socketId field and filter out self + dedupe by socketId
  const mapped = users
    .map((u) => (typeof u === "string" ? { socketId: u } : u))
    .map((u) => ({ ...u, socketId: String(u.socketId ?? u.id ?? u) }))
    .filter((u) => u.socketId && u.socketId !== mySocketId);

  const dedup = Array.from(
    new Map(mapped.map((u) => [u.socketId, u])).values()
  );

  connectedUsers.value = dedup;

  // Only create peers when we've actually joined the voice (we have local stream)
  if (isInVoice.value && localStream.value) {
    for (const u of dedup) {
      const uid = String(u.socketId);
      if (!peers[uid]) {
        // If we joined after them, we should be the initiator
        createPeer(uid, true);
      }
    }
  }
}

function requestRoomUsers() {
  const roomId = props.channelId || (props.currentChannel as any)?.id || "";
  if (!roomId) return;
  if (!wsStore.connection) return;
  try {
    ws.sendMessage("get-room-users", { roomId });
    console.debug("Requested room users for", roomId);
  } catch (e) {
    console.debug("Failed to request room users:", e);
  }
}

function handleUserJoined(payload: any) {
  console.debug("socket event: user-joined", payload);
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: "user-joined",
    payload,
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();

  // server emits { user: {...} }
  const userObj = payload?.user ?? payload;
  if (!userObj) return;
  const socketId = String(userObj.socketId ?? userObj.id ?? userObj);
  const mySocketId = wsStore.connection?.id;
  if (!socketId || socketId === mySocketId) return;

  // Add user object and dedupe
  const exists = connectedUsers.value.find(
    (u: any) => String(u.socketId) === socketId
  );
  if (!exists) connectedUsers.value.push({ ...userObj, socketId });

  // Existing clients should NOT initiate when someone else joins — they should wait and answer.
  if (!peers[socketId]) createPeer(socketId, false);
}

function handleUserLeft(payload: any) {
  console.debug("socket event: user-left", payload);
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: "user-left",
    payload,
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
  // Normalize payload to socketId string. Support several payload shapes.
  if (!payload) return;
  let socketId: string | null = null;
  if (typeof payload === "string") socketId = payload;
  else if (payload.socketId) socketId = String(payload.socketId);
  else if (payload.id) socketId = String(payload.id);
  else if (payload.userId) socketId = String(payload.userId);
  else if (payload.user && (payload.user.socketId || payload.user.id))
    socketId = String(payload.user.socketId ?? payload.user.id);

  if (!socketId) return;

  // Remove matching user object(s) from connectedUsers (compare socketId or id)
  connectedUsers.value = connectedUsers.value.filter((u: any) => {
    const uSid = String(u?.socketId ?? u?.id ?? u);
    return uSid !== socketId;
  });

  // Close and remove RTCPeerConnection if exists
  const pc = peers[socketId];
  if (pc) {
    try {
      pc.close();
    } catch (e) {
      console.warn("Error closing peer for", socketId, e);
    }
    delete peers[socketId];
  }

  // Stop and remove remote MediaStream
  const rStream = remoteStreams[socketId];
  if (rStream) {
    try {
      for (const t of rStream.getTracks()) t.stop();
    } catch (e) {
      /* ignore */
    }
    delete remoteStreams[socketId];
  }

  // Cleanup audio element if present
  const audioEl = remoteAudioElements[socketId];
  if (audioEl) {
    try {
      (audioEl as HTMLAudioElement).srcObject = null;
    } catch (e) {
      /* ignore */
    }
    delete remoteAudioElements[socketId];
  }
}

function handleChannelPresence(payload: any) {
  console.debug("socket event: channel-presence", payload);
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: "channel-presence",
    payload,
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();

  const roomId =
    payload?.roomId ?? (payload && payload.roomId === 0 ? 0 : null);
  const currentRoomId =
    props.channelId || (props.currentChannel as any)?.id || null;
  if (!roomId || !currentRoomId) return;
  if (String(roomId) !== String(currentRoomId)) return;

  const users = Array.isArray(payload?.users) ? payload.users : [];
  const mySocketId = wsStore.connection?.id;

  const mapped = users
    .map((u: any) => (typeof u === "string" ? { socketId: u } : u))
    .map((u: any) => ({ ...u, socketId: String(u.socketId ?? u.id ?? u) }))
    .filter((u: any) => u.socketId && u.socketId !== mySocketId);

  const dedup = Array.from(
    new Map(mapped.map((u: any) => [u.socketId, u])).values()
  );
  connectedUsers.value = dedup;
}

async function handleSignal(data: {
  type: string;
  payload: any;
  from: string;
}) {
  const { type, payload, from } = data as any;
  console.debug("socket event: signal", { type, from, payload });
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: `signal:${type}`,
    payload: { from, payload },
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
  if (!from) return;

  let pc = peers[from];
  if (!pc) {
    // Create peer but not initiator (we expect to answer)
    pc = createPeer(from, false);
  }

  try {
    if (type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.sendMessage("signal", { type: "answer", payload: answer, to: from });
    } else if (type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
    } else if (type === "ice") {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload));
      } catch (e) {
        console.warn("Failed to add ICE candidate:", e);
      }
    }
  } catch (e) {
    console.error("Error handling signal:", e);
  }
}

function attachSocketListeners() {
  if (listenersAttached) return;
  const conn = wsStore.connection;
  if (!conn) return;

  try {
    conn.on("room-users", handleRoomUsers);
    conn.on("user-joined", handleUserJoined);
    conn.on("user-left", handleUserLeft);
    // Listen for community broadcasts about channel presence so we can show participants before joining
    conn.on("channel-presence", handleChannelPresence);
    conn.on("signal", handleSignal);
    console.debug("voice: attached socket listeners");
  } catch (e) {
    console.debug("voice: failed to attach socket listeners", e);
  }

  listenersAttached = true;
}

function setRemoteAudioElement(el: any, uid: string) {
  const audioEl = el as HTMLAudioElement | null;
  if (audioEl) {
    remoteAudioElements[uid] = audioEl;
    // If we already have stream for this uid, attach it
    if (remoteStreams[uid]) {
      try {
        audioEl.srcObject = remoteStreams[uid];
      } catch (e) {
        console.warn("Failed to set srcObject on remote audio element:", e);
      }
    }
  } else {
    remoteAudioElements[uid] = null;
  }
}

function detachSocketListeners() {
  const conn = wsStore.connection;
  if (!conn || !listenersAttached) return;

  try {
    conn.off("room-users", handleRoomUsers);
    conn.off("user-joined", handleUserJoined);
    conn.off("user-left", handleUserLeft);
    conn.off("signal", handleSignal);
  } catch (e) {
    // ignore
  }
  listenersAttached = false;
}

// Watch for connection becoming available and attach listeners
watch(
  () => wsStore.connection,
  (conn) => {
    if (conn) {
      attachSocketListeners();
      // When socket connects, request current room users so we can show them even if not joined
      try {
        requestRoomUsers();
      } catch (e) {
        // ignore
      }
    }
  }
);

// Watch for channel changes so we can re-request users when the user navigates
watch(
  () => [props.channelId, props.currentChannel],
  () => {
    try {
      requestRoomUsers();
    } catch (e) {
      // ignore
    }
  }
);

onBeforeUnmount(() => {
  leaveVoice();
});
</script>

<template>
  <div class="channel-page flex h-full bg-dark-800">
    <!-- Main Voice Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="{ 'mr-[320px]': isOpenSlideoverMember }"
    >
      <!-- Channel Header -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-mic" class="w-5 h-5 text-[#b9bbbe]" />
          <h1 class="text-white font-semibold truncate">
            {{ currentChannel?.name }}
          </h1>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <UButton class="p-1 text-[#b9bbbe] hover:text-white" variant="ghost">
            <UIcon name="i-lucide-settings" class="w-5 h-5" />
          </UButton>
          <UButton
            class="p-1 text-[#b9bbbe] hover:text-white"
            variant="ghost"
            @click="toggleMemberPanel"
          >
            <UIcon name="i-lucide-users-round" class="w-5 h-5" />
          </UButton>
        </div>
      </div>

      <!-- Voice Channel Content  -->
      <div class="flex-1 flex flex-col bg-dark-900 p-6">
        <div class="flex-1 flex items-center justify-center">
          <div class="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- If no participants, show a friendly empty state with room name + CTA -->
            <template v-if="participants.length === 0">
              <div class="col-span-1 md:col-span-2">
                <div
                  class="relative bg-dark-700 rounded-xl overflow-hidden flex flex-col h-72 items-center justify-center"
                >
                  <div class="text-center px-6">
                    <div class="text-2xl font-semibold text-white mb-2">
                      {{ currentChannel?.name || props.channelId }}
                    </div>
                    <div class="text-sm text-gray-300 mb-4">
                      Hãy tham gia để bắt đầu cuộc trò chuyện.
                    </div>
                    <button
                      @click="joinVoice"
                      class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium"
                    >
                      Tham gia thoại
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div
                v-for="p in participants"
                :key="p.socketId"
                class="relative bg-dark-700 rounded-xl overflow-hidden flex flex-col h-72"
              >
                <!-- Large image/banner area with centered avatar overlay -->
                <div
                  class="w-full h-full flex items-center justify-center bg-gray-800 relative overflow-hidden"
                >
                  <template v-if="p.banner">
                    <img :src="p.banner" class="w-full h-full object-cover" />
                  </template>
                  <template v-else>
                    <div
                      class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-5xl font-bold text-white"
                    >
                      {{ (p.username || "").charAt(0).toUpperCase() }}
                    </div>
                  </template>

                  <!-- Centered avatar overlay on top of banner -->
                  <div
                    class="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div
                      class="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ring-4 ring-black/60 shadow-lg"
                    >
                      <template v-if="p.avatar">
                        <img
                          :src="p.avatar"
                          class="w-full h-full object-cover"
                        />
                      </template>
                      <template v-else>
                        <span class="text-white text-2xl font-semibold">{{
                          (p.username || "").charAt(0).toUpperCase()
                        }}</span>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- Bottom centered banner with name -->
                <div
                  class="absolute left-1/2 transform -translate-x-1/2 bottom-4 bg-black/60 rounded-full px-3 py-1 flex items-center gap-3"
                >
                  <div class="text-white text-sm font-medium">
                    {{ p.username }}
                  </div>
                </div>

                <!-- Hidden audio element for remote stream -->
                <audio
                  v-if="!p.local"
                  :ref="(el) => setRemoteAudioElement(el, p.socketId)"
                  autoplay
                  playsinline
                  class="hidden"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- Bottom control bar -->
        <div class="mt-4 flex items-center justify-center">
          <div
            class="bg-dark-800 rounded-full px-4 py-3 flex items-center gap-4 shadow-lg"
          >
            <button
              class="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f3136] hover:bg-[#393c40] text-white"
              :class="{ 'bg-red-600': isInVoice }"
              @click="isInVoice ? leaveVoice() : joinVoice()"
              aria-label="Join or leave voice"
            >
              <UIcon
                :name="isInVoice ? 'i-lucide-phone-off' : 'i-lucide-phone'"
                class="w-5 h-5"
              />
            </button>

            <button
              class="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f3136] hover:bg-[#393c40] text-white"
              :class="{ 'opacity-60': muted }"
              @click="toggleMute()"
              aria-label="Toggle mute"
            >
              <UIcon
                :name="muted ? 'i-lucide-mic-off' : 'i-lucide-mic'"
                class="w-5 h-5"
              />
            </button>

            <button
              class="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f3136] hover:bg-[#393c40] text-white"
              aria-label="Deafen"
            >
              <UIcon name="i-lucide-headphones" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Members Panel - Fixed position on the right -->
    <Transition name="slide">
      <div
        v-if="isOpenSlideoverMember"
        class="fixed top-0 right-0 w-[320px] h-full border-l border-[#202225] bg-dark-800 p-4 overflow-y-auto z-50"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center text-lg">
            <UIcon name="i-lucide-users-round" class="w-5 h-5 mr-2" />
            Hoạt động —
            {{
              memberStore.getMemberCount(
                (route.params.guild_id as string) || ""
              )
            }}
          </h3>
          <div class="flex items-center gap-2">
            <UButton
              @click="refreshMembers"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
              :loading="memberStore.isLoading"
              size="sm"
            >
              <UIcon name="i-lucide-refresh-ccw" class="w-4 h-4" />
            </UButton>
            <UButton
              @click="closeMemberPanel"
              variant="ghost"
              class="text-[#b9bbbe] hover:text-white p-1"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </UButton>
          </div>
        </div>

        <!-- Members List -->
        <div class="space-y-2">
          <div class="text-center text-[#72767d]">
            <UIcon name="i-lucide-users" class="w-12 h-12 mx-auto mb-3" />
            <p>Danh sách thành viên sẽ hiển thị ở đây</p>
          </div>
        </div>
      </div>
    </Transition>
    <!-- Debug panel (toggle with ?voice_debug=1) -->
    <div
      v-if="showDebug"
      class="fixed left-4 bottom-4 w-80 max-h-64 overflow-y-auto bg-black/80 text-white text-sm p-3 rounded-md z-60"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold">Socket Debug</div>
        <div class="text-xs text-gray-300">
          events: {{ socketDebugEvents.length }}
        </div>
      </div>
      <div class="space-y-2">
        <div
          v-for="ev in socketDebugEvents"
          :key="ev.t"
          class="border-b border-white/5 pb-1"
        >
          <div class="text-xs text-gray-300">
            {{ new Date(ev.t).toLocaleTimeString() }} · {{ ev.event }}
          </div>
          <pre class="text-xs text-white break-words">{{
            JSON.stringify(ev.payload, null, 2)
          }}</pre>
        </div>
      </div>
    </div>
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
