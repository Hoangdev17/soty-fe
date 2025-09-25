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
// Keep per-peer transceiver references so we can target camera vs screen tracks
const transceiversMap = reactive<
  Record<
    string,
    {
      audio?: RTCRtpTransceiver;
      camera?: RTCRtpTransceiver;
      screen?: RTCRtpTransceiver;
    }
  >
>({});
const remoteStreams = reactive<Record<string, MediaStream>>({});
const remoteAudioElements = reactive<Record<string, HTMLAudioElement | null>>(
  {}
);
const remoteVideoElements = reactive<Record<string, HTMLVideoElement | null>>(
  {}
);
const remoteScreenVideoElements = reactive<
  Record<string, HTMLVideoElement | null>
>({});
const remoteIsSharingScreen = reactive<Record<string, boolean>>({});
const remoteHasVideo = reactive<Record<string, boolean>>({});
const connectedUsers = ref<any[]>([]); // array of user objects { socketId, id, username, avatar, banner }
const localAudioRef = ref<HTMLAudioElement | null>(null);
const localCameraVideoRef = ref<HTMLVideoElement | null>(null);
const localScreenVideoRef = ref<HTMLVideoElement | null>(null);

let listenersAttached = false;

const muted = ref(false);
const cameraOn = ref(false);
const screenOn = ref(false);
const screenStream = ref<MediaStream | null>(null);

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
function createPeer(
  remoteId: string,
  isInitiator = false,
  mediaOrder?: string[]
) {
  if (peers[remoteId]) return peers[remoteId];

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Relay local tracks
  // Create stable transceivers. If mediaOrder is provided (parsed from incoming offer),
  // create transceivers in the same m-line order to avoid m-line ordering mismatches.
  // Otherwise fall back to the default fixed order: audio, camera, screen.
  let audioTrans: RTCRtpTransceiver | null = null;
  let cameraTrans: RTCRtpTransceiver | null = null;
  let screenTrans: RTCRtpTransceiver | null = null;

  const haveCamera = !!(
    localStream.value && localStream.value.getVideoTracks().length > 0
  );
  const haveScreen =
    !!(screenStream.value && screenStream.value.getVideoTracks().length > 0) ||
    !!screenOn.value;

  try {
    if (Array.isArray(mediaOrder) && mediaOrder.length > 0) {
      // create transceivers matching the incoming offer's m-line order
      let videoCount = 0;
      for (const m of mediaOrder) {
        try {
          if (m === "audio" && !audioTrans) {
            audioTrans = pc.addTransceiver("audio", { direction: "sendrecv" });
          } else if (m === "video") {
            // first video -> camera transceiver, second video -> screen transceiver
            videoCount += 1;
            if (videoCount === 1 && !cameraTrans) {
              cameraTrans = pc.addTransceiver("video", {
                direction: haveCamera ? "sendrecv" : "recvonly",
              });
            } else if (videoCount === 2 && !screenTrans) {
              screenTrans = pc.addTransceiver("video", {
                direction: haveScreen ? "sendrecv" : "recvonly",
              });
            } else {
              // extra video m-lines: reserve as recvonly
              pc.addTransceiver("video", { direction: "recvonly" });
            }
          } else {
            // for unknown m-lines, attempt to reserve a recvonly transceiver
            try {
              pc.addTransceiver(m as any, { direction: "recvonly" });
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          // ignore single transceiver add failure and continue
        }
      }
      // If no audio transceiver was created by mediaOrder, create a default audio transceiver
      if (!audioTrans) {
        try {
          audioTrans = pc.addTransceiver("audio", { direction: "sendrecv" });
        } catch (e) {
          audioTrans = null;
        }
      }
      // If only one video m-line in offer but we still want reserved screen transceiver, create it as recvonly
      if (!screenTrans) {
        try {
          screenTrans = pc.addTransceiver("video", {
            direction: haveScreen ? "sendrecv" : "recvonly",
          });
        } catch (e) {
          screenTrans = null;
        }
      }
    } else {
      // Default fixed-order reservation (audio, camera, screen)
      try {
        audioTrans = pc.addTransceiver("audio", { direction: "sendrecv" });
      } catch (e) {
        audioTrans = null;
      }
      try {
        cameraTrans = pc.addTransceiver("video", {
          direction: haveCamera ? "sendrecv" : "recvonly",
        });
      } catch (e) {
        cameraTrans = null;
      }
      try {
        screenTrans = pc.addTransceiver("video", {
          direction: haveScreen ? "sendrecv" : "recvonly",
        });
      } catch (e) {
        screenTrans = null;
      }
    }
  } catch (e) {
    // ignore overall transceiver creation errors
  }

  // Save references so toggles can replace tracks on the correct transceiver
  try {
    transceiversMap[remoteId] = {
      audio: audioTrans ?? undefined,
      camera: cameraTrans ?? undefined,
      screen: screenTrans ?? undefined,
    };
  } catch (e) {
    // ignore
  }

  // Attach existing local tracks to transceiver senders (preferred) or fallback to addTrack
  if (localStream.value) {
    try {
      const audioTrack = localStream.value.getAudioTracks()[0];
      if (audioTrack) {
        if (
          audioTrans &&
          (audioTrans as any).sender &&
          (audioTrans as any).sender.replaceTrack
        ) {
          try {
            (audioTrans as any).sender.replaceTrack(audioTrack);
          } catch (e) {
            try {
              pc.addTrack(audioTrack, localStream.value);
            } catch (err) {}
          }
        } else {
          try {
            pc.addTrack(audioTrack, localStream.value);
          } catch (e) {}
        }
      }
    } catch (e) {
      /* ignore */
    }

    try {
      const camTrack = localStream.value.getVideoTracks()[0];
      if (camTrack) {
        if (
          cameraTrans &&
          (cameraTrans as any).sender &&
          (cameraTrans as any).sender.replaceTrack
        ) {
          try {
            (cameraTrans as any).sender.replaceTrack(camTrack);
          } catch (e) {
            try {
              pc.addTrack(camTrack, localStream.value);
            } catch (err) {}
          }
        } else {
          try {
            pc.addTrack(camTrack, localStream.value);
          } catch (e) {}
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  // If we currently have an active screen stream, attach its track to the reserved screen transceiver
  if (screenStream.value) {
    try {
      const screenTrack = screenStream.value.getVideoTracks()[0];
      if (screenTrack) {
        if (
          screenTrans &&
          (screenTrans as any).sender &&
          (screenTrans as any).sender.replaceTrack
        ) {
          try {
            (screenTrans as any).sender.replaceTrack(screenTrack);
          } catch (e) {
            try {
              pc.addTrack(screenTrack, screenStream.value);
            } catch (err) {}
          }
        } else {
          try {
            pc.addTrack(screenTrack, screenStream.value);
          } catch (e) {}
        }
      }
    } catch (e) {
      /* ignore */
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

    // Attach to any rendered audio/video elements, preferring screen element when
    // the remote is flagged as sharing their screen so we don't show duplicate tiles.
    nextTick(() => {
      const audioEl = remoteAudioElements[remoteId];
      if (audioEl) {
        try {
          (audioEl as HTMLAudioElement).srcObject = incomingStream;
        } catch (e) {
          console.warn("Failed to attach remote stream to audio element:", e);
        }
      }

      const vidEl = remoteVideoElements[remoteId];
      const screenEl = remoteScreenVideoElements[remoteId];
      const isSharing = !!remoteIsSharingScreen[remoteId];

      try {
        if (isSharing && screenEl) {
          try {
            (screenEl as HTMLVideoElement).srcObject = incomingStream;
          } catch (e) {
            console.warn(
              "Failed to attach remote stream to screen element:",
              e
            );
          }
          try {
            if (vidEl) (vidEl as HTMLVideoElement).srcObject = null;
          } catch (e) {
            /* ignore */
          }
        } else if (vidEl) {
          try {
            (vidEl as HTMLVideoElement).srcObject = incomingStream;
          } catch (e) {
            console.warn("Failed to attach remote stream to video element:", e);
          }
          try {
            if (screenEl) (screenEl as HTMLVideoElement).srcObject = null;
          } catch (e) {
            /* ignore */
          }
        } else if (screenEl) {
          // fallback: attach to screen element if no camera element present
          try {
            (screenEl as HTMLVideoElement).srcObject = incomingStream;
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn("Failed to attach remote stream to video elements:", e);
      }

      // Mark that remote has video if stream contains video tracks
      try {
        remoteHasVideo[remoteId] = !!(
          incomingStream &&
          incomingStream.getVideoTracks &&
          incomingStream.getVideoTracks().length > 0
        );
      } catch (e) {
        remoteHasVideo[remoteId] = false;
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
        socketDebugEvents.value.unshift({
          t: Date.now(),
          event: "created-offer",
          payload: { to: remoteId, sdp: offer.sdp?.slice(0, 2000) },
        });
        if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
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

async function startLocalMedia(enableCamera = false) {
  try {
    // If we already have a localStream and only enabling camera, request only video
    if (enableCamera && localStream.value) {
      const vStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      // Add video tracks to existing localStream (keep camera preview in sync)
      for (const t of vStream.getVideoTracks()) {
        try {
          localStream.value.addTrack(t);
        } catch (e) {
          console.warn("Failed to add video track to existing localStream:", e);
        }
      }
      // Attach to local video element (camera preview)
      if (localCameraVideoRef.value)
        localCameraVideoRef.value.srcObject = localStream.value;
      // Do NOT call pc.addTrack here (that would create a new m-line dynamically).
      // Peers will be updated by toggleCamera which prefers sender.replaceTrack or
      // recreates the peer to establish correct transceivers.
      return;
    }

    const constraints: any = { audio: true };
    if (enableCamera) constraints.video = { width: 640, height: 480 };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // If we already had an existing stream, try to preserve existing audio tracks
    if (localStream.value && enableCamera) {
      // Merge video tracks into existing localStream
      for (const t of stream.getVideoTracks()) {
        try {
          localStream.value.addTrack(t);
        } catch (e) {
          console.warn("Failed to add video track to existing localStream:", e);
        }
      }
    } else {
      localStream.value = stream;
    }

    if (localAudioRef.value) localAudioRef.value.srcObject = localStream.value;
    if (localCameraVideoRef.value)
      localCameraVideoRef.value.srcObject = localStream.value;
  } catch (e) {
    console.error("Failed to get local media:", e);
  }
}

function setLocalVideoElement(el: any, type: "camera" | "screen" = "camera") {
  const videoEl = el as HTMLVideoElement | null;
  if (type === "camera") {
    if (videoEl) {
      localCameraVideoRef.value = videoEl;
      if (localStream.value) {
        try {
          videoEl.srcObject = localStream.value;
        } catch (e) {
          console.warn("Failed to set local camera srcObject:", e);
        }
      }
    } else {
      localCameraVideoRef.value = null;
    }
  } else {
    if (videoEl) {
      localScreenVideoRef.value = videoEl;
      if (screenStream.value) {
        try {
          videoEl.srcObject = screenStream.value;
        } catch (e) {
          console.warn("Failed to set local screen srcObject:", e);
        }
      } else if (localStream.value) {
        // fallback to localStream
        try {
          videoEl.srcObject = localStream.value;
        } catch (e) {
          console.warn("Failed to set local screen fallback srcObject:", e);
        }
      }
    } else {
      localScreenVideoRef.value = null;
    }
  }
}

function setRemoteVideoElement(
  el: any,
  uid: string,
  type: "camera" | "screen" = "camera"
) {
  const videoEl = el as HTMLVideoElement | null;
  if (type === "camera") {
    if (videoEl) {
      remoteVideoElements[uid] = videoEl;
      if (remoteStreams[uid]) {
        try {
          videoEl.srcObject = remoteStreams[uid];
        } catch (e) {
          console.warn("Failed to set remote camera srcObject:", e);
        }
      }
    } else {
      remoteVideoElements[uid] = null;
    }
  } else {
    if (videoEl) {
      remoteScreenVideoElements[uid] = videoEl;
      if (remoteStreams[uid]) {
        try {
          videoEl.srcObject = remoteStreams[uid];
        } catch (e) {
          console.warn("Failed to set remote screen srcObject:", e);
        }
      }
    } else {
      remoteScreenVideoElements[uid] = null;
    }
  }
}

function hasRemoteVideo(uid: string) {
  try {
    if (remoteHasVideo[uid]) return true;
    const s = remoteStreams[uid];
    return !!(
      s &&
      typeof s.getVideoTracks === "function" &&
      s.getVideoTracks().length > 0
    );
  } catch (e) {
    return false;
  }
}

async function toggleCamera() {
  cameraOn.value = !cameraOn.value;
  if (cameraOn.value) {
    // If screen is currently on, stop screen sharing first so only one video source exists
    if (screenOn.value) {
      try {
        await toggleScreenShare();
      } catch (e) {
        console.warn(
          "toggleCamera: failed to stop screen share before enabling camera",
          e
        );
      }
    }
    // enable camera: get video tracks, add to local stream/peers, then renegotiate
    await startLocalMedia(true);

    if (!localStream.value) return;
    const videoTrack = localStream.value.getVideoTracks()[0];

    for (const [remoteId, pc] of Object.entries(peers)) {
      try {
        // Prefer using the stored camera transceiver sender so we don't change m-line ordering
        const tx = transceiversMap[remoteId]?.camera as
          | RTCRtpTransceiver
          | undefined;
        if (
          tx &&
          (tx as any).sender &&
          typeof (tx as any).sender.replaceTrack === "function" &&
          videoTrack
        ) {
          try {
            try {
              (tx as any).direction = "sendrecv";
            } catch (e) {}
            await (tx as any).sender.replaceTrack(videoTrack);
          } catch (e) {
            console.warn(
              "toggleCamera: failed to replace on camera transceiver, falling back",
              e
            );
          }
        } else {
          // fallback: existing logic using generic senders/transceivers
          const videoSender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (
            videoSender &&
            typeof (videoSender as any).replaceTrack === "function" &&
            videoTrack
          ) {
            try {
              await videoSender.replaceTrack(videoTrack);
            } catch (e) {
              console.warn(
                "Failed to replace video sender track, will try transceiver/add:",
                e
              );
            }
          } else if (videoTrack) {
            try {
              // Use stored camera transceiver if available to avoid changing m-line order
              const storedCam = transceiversMap[remoteId]?.camera as
                | RTCRtpTransceiver
                | undefined;
              if (
                storedCam &&
                (storedCam as any).sender &&
                typeof (storedCam as any).sender.replaceTrack === "function"
              ) {
                try {
                  try {
                    (storedCam as any).direction = "sendrecv";
                  } catch (e) {}
                  await (storedCam as any).sender.replaceTrack(videoTrack);
                } catch (e) {
                  console.warn(
                    "toggleCamera: failed to replace on stored camera transceiver",
                    remoteId,
                    e
                  );
                }
              } else {
                console.warn(
                  "toggleCamera: camera transceiver missing for",
                  remoteId,
                  "— recreating peer to establish correct transceivers"
                );
                try {
                  const old = peers[remoteId];
                  if (old) old.close();
                } catch (e) {}
                delete peers[remoteId];
                createPeer(remoteId, true);
                continue;
              }
            } catch (e) {
              console.warn(
                "toggleCamera: error replacing stored camera transceiver for peer",
                remoteId,
                e
              );
            }
          }
        }
      } catch (e) {
        console.warn(
          "toggleCamera: error adding/replacing tracks to peer",
          remoteId,
          e
        );
      }

      // Renegotiate with this peer so remote will receive new tracks
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketDebugEvents.value.unshift({
          t: Date.now(),
          event: "reneg-offer",
          payload: { to: remoteId, sdp: offer.sdp?.slice(0, 2000) },
        });
        if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
        ws.sendMessage("signal", {
          type: "offer",
          payload: offer,
          to: remoteId,
        });
      } catch (e) {
        console.warn("Failed to renegotiate (offer) with", remoteId, e);
      }

      // Fallback: if remote still doesn't report video after timeout, recreate peer
      (function (rId) {
        setTimeout(() => {
          try {
            if (!remoteHasVideo[rId]) {
              console.warn(
                "Remote did not receive video after renegotiate, recreating peer:",
                rId
              );
              const old = peers[rId];
              try {
                if (old) old.close();
              } catch (e) {}
              delete peers[rId];
              // createPeer will initiate and send new offer
              createPeer(rId, true);
            }
          } catch (e) {
            /* ignore */
          }
        }, 2000);
      })(remoteId);
    }
    // Broadcast our video presence to others
    try {
      const roomId =
        props.channelId || (props.currentChannel as any)?.id || null;
      ws.sendMessage("video-presence", {
        roomId,
        socketId: wsStore.connection?.id,
        hasVideo: true,
      });
    } catch (e) {
      // ignore
    }
    return;
  }

  // disabling camera: replace/stop tracks and renegotiate so remote stops receiving video
  if (!localStream.value) return;

  for (const [remoteId, pc] of Object.entries(peers)) {
    try {
      // Prefer keeping transceiver and set to recvonly, then replace track with null
      const trans = pc
        .getTransceivers()
        .find(
          (t) =>
            (t.sender &&
              (t.sender as any).track &&
              (t.sender as any).track.kind === "video") ||
            (t.receiver &&
              (t.receiver as any).track &&
              (t.receiver as any).track.kind === "video")
        );
      if (trans) {
        try {
          (trans as any).direction = "recvonly";
        } catch (e) {}
        try {
          if ((trans as any).sender && (trans as any).sender.replaceTrack)
            await (trans as any).sender.replaceTrack(null as any);
        } catch (e) {
          console.warn("Failed to replace video sender track:", e);
        }
      } else {
        const senders = pc.getSenders();
        for (const s of senders) {
          if (s.track && s.track.kind === "video") {
            try {
              if (s.replaceTrack) await s.replaceTrack(null as any);
            } catch (e) {
              console.warn("Failed to replace video sender track:", e);
            }
          }
        }
      }

      // Renegotiate so remote side knows video removed
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.sendMessage("signal", {
          type: "offer",
          payload: offer,
          to: remoteId,
        });
      } catch (e) {
        console.warn(
          "Failed to renegotiate (offer) after removing video for",
          remoteId,
          e
        );
      }
    } catch (e) {
      /* ignore */
    }
  }

  // Broadcast our video presence false
  try {
    const roomId = props.channelId || (props.currentChannel as any)?.id || null;
    ws.sendMessage("video-presence", {
      roomId,
      socketId: wsStore.connection?.id,
      hasVideo: false,
    });
  } catch (e) {
    // ignore
  }

  // Stop and remove local video tracks
  try {
    for (const t of localStream.value.getVideoTracks()) {
      try {
        t.stop();
      } catch (e) {}
      try {
        localStream.value.removeTrack(t);
      } catch (e) {}
    }
  } catch (e) {
    /* ignore */
  }

  if (localCameraVideoRef.value) {
    try {
      localCameraVideoRef.value.srcObject = null;
    } catch (e) {}
  }
}

// Toggle screen sharing (display media). This will replace the outgoing video track
// with the screen track (if any) and renegotiate with peers. Stopping screen share
// will restore the camera video track if available, otherwise remove video send.
async function toggleScreenShare() {
  screenOn.value = !screenOn.value;

  // start screen share
  if (screenOn.value) {
    // If camera is currently on, disable it first so we don't have two outgoing video tracks
    if (cameraOn.value) {
      try {
        await toggleCamera();
      } catch (e) {
        console.warn(
          "toggleScreenShare: failed to stop camera before starting screen share",
          e
        );
      }
    }
    try {
      // Request display media (may prompt the user)
      const s = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
      });
      screenStream.value = s as MediaStream;

      // Add screen track to the localStream alongside camera (so both can exist simultaneously)
      try {
        const screenTrack = screenStream.value.getVideoTracks()[0];
        if (localStream.value) {
          // Do not remove camera tracks; just add screen track so camera and screen occupy
          // separate transceivers we reserved earlier.
          try {
            if (screenTrack) localStream.value.addTrack(screenTrack);
          } catch (e) {
            console.warn("Failed to add screen track to localStream:", e);
          }
        } else {
          // If we don't have a local stream (rare), use screenStream as localStream
          localStream.value = screenStream.value;
        }
        // Use the screenStream for local preview so user sees what they're sharing immediately
        if (localScreenVideoRef.value) {
          try {
            localScreenVideoRef.value.srcObject = screenStream.value;
          } catch (e) {
            /* ignore */
          }
        }

        // Immediately notify others we have video so avatars hide right away
        try {
          const roomId =
            props.channelId || (props.currentChannel as any)?.id || null;
          ws.sendMessage("video-presence", {
            roomId,
            socketId: wsStore.connection?.id,
            hasVideo: true,
          });
        } catch (e) {}
      } catch (e) {
        /* ignore */
      }

      // Listen for user stopping screen share via browser UI
      try {
        const [track] = screenStream.value.getVideoTracks();
        if (track) {
          track.onended = () => {
            // ensure we stop sharing when the track ends
            if (screenOn.value) {
              screenOn.value = false;
              // try to restore camera if it was on
              (async () => {
                if (cameraOn.value) {
                  // camera already on: ensure localStream has camera video
                  await startLocalMedia(true);
                }
                // replace senders with camera or null
                for (const [remoteId, pc] of Object.entries(peers)) {
                  try {
                    const senders = pc.getSenders();
                    const vidSender = senders.find(
                      (s) => s.track && s.track.kind === "video"
                    );
                    if (vidSender) {
                      // prefer camera track if present
                      const camTrack =
                        localStream.value
                          ?.getVideoTracks()
                          .find((tr) => tr.kind === "video" && tr !== track) ??
                        null;
                      if (typeof (vidSender as any).replaceTrack === "function")
                        await (vidSender as any).replaceTrack(camTrack as any);
                    }
                    // renegotiate
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketDebugEvents.value.unshift({
                      t: Date.now(),
                      event: "reneg-offer",
                      payload: { to: remoteId, sdp: offer.sdp?.slice(0, 2000) },
                    });
                    if (socketDebugEvents.value.length > 20)
                      socketDebugEvents.value.pop();
                    ws.sendMessage("signal", {
                      type: "offer",
                      payload: offer,
                      to: remoteId,
                    });
                  } catch (e) {
                    console.warn(
                      "toggleScreenShare: failed to restore after screen end",
                      remoteId,
                      e
                    );
                  }
                }
              })();
            }
          };
        }
      } catch (e) {
        /* ignore */
      }

      // Attach to local preview (use localStream so preview matches what peers receive)
      if (localCameraVideoRef.value) {
        try {
          localCameraVideoRef.value.srcObject = localStream.value;
        } catch (e) {}
      }

      socketDebugEvents.value.unshift({
        t: Date.now(),
        event: "screen-share-start",
        payload: { roomId: props.channelId, socketId: wsStore.connection?.id },
      });
      if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();

      // Replace outgoing video track on each peer
      for (const [remoteId, pc] of Object.entries(peers)) {
        try {
          const screenTrack = screenStream.value.getVideoTracks()[0];
          if (!screenTrack) continue;
          // Prefer the reserved screen transceiver if available
          const stx = transceiversMap[remoteId]?.screen as
            | RTCRtpTransceiver
            | undefined;
          if (
            stx &&
            (stx as any).sender &&
            typeof (stx as any).sender.replaceTrack === "function"
          ) {
            try {
              try {
                (stx as any).direction = "sendrecv";
              } catch (e) {}
              await (stx as any).sender.replaceTrack(screenTrack);
            } catch (e) {
              console.warn(
                "toggleScreenShare: failed to replace on screen transceiver, falling back",
                e
              );
            }
          } else {
            // If reserved screen transceiver exists, prefer replacing its sender
            const stxStored = transceiversMap[remoteId]?.screen as
              | RTCRtpTransceiver
              | undefined;
            if (
              stxStored &&
              (stxStored as any).sender &&
              typeof (stxStored as any).sender.replaceTrack === "function"
            ) {
              try {
                try {
                  (stxStored as any).direction = "sendrecv";
                } catch (e) {}
                await (stxStored as any).sender.replaceTrack(screenTrack);
              } catch (e) {
                console.warn(
                  "toggleScreenShare: failed to replace on stored screen transceiver",
                  remoteId,
                  e
                );
              }
            } else {
              console.warn(
                "toggleScreenShare: screen transceiver missing for",
                remoteId,
                "— recreating peer to establish correct transceivers"
              );
              try {
                const old = peers[remoteId];
                if (old) old.close();
              } catch (e) {}
              delete peers[remoteId];
              createPeer(remoteId, true);
              continue;
            }
          }

          // Renegotiate
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketDebugEvents.value.unshift({
              t: Date.now(),
              event: "screen-reneg-offer",
              payload: { to: remoteId, sdp: offer.sdp?.slice(0, 2000) },
            });
            if (socketDebugEvents.value.length > 20)
              socketDebugEvents.value.pop();
            ws.sendMessage("signal", {
              type: "offer",
              payload: offer,
              to: remoteId,
            });
          } catch (e) {
            console.warn("toggleScreenShare: renegotiate failed", remoteId, e);
          }

          // Fallback: if remote still doesn't report video after timeout, recreate peer
          (function (rId) {
            setTimeout(() => {
              try {
                if (!remoteHasVideo[rId]) {
                  console.warn(
                    "Remote did not receive screen share after renegotiate, recreating peer:",
                    rId
                  );
                  socketDebugEvents.value.unshift({
                    t: Date.now(),
                    event: "screen-share-recreate-peer",
                    payload: { remoteId: rId },
                  });
                  if (socketDebugEvents.value.length > 20)
                    socketDebugEvents.value.pop();
                  const old = peers[rId];
                  try {
                    if (old) old.close();
                  } catch (e) {}
                  delete peers[rId];
                  createPeer(rId, true);
                }
              } catch (e) {
                /* ignore */
              }
            }, 2000);
          })(remoteId);
        } catch (e) {
          console.warn("toggleScreenShare: error handling peer", remoteId, e);
        }
      }

      // Optionally notify others about sharing state
      try {
        const roomId =
          props.channelId || (props.currentChannel as any)?.id || null;
        ws.sendMessage("screen-presence", {
          roomId,
          socketId: wsStore.connection?.id,
          isSharing: true,
        });
        // inform UI consumers we have video so avatar hides
        ws.sendMessage("video-presence", {
          roomId,
          socketId: wsStore.connection?.id,
          hasVideo: true,
        });
      } catch (e) {}
    } catch (e) {
      console.error("Failed to start screen share:", e);
      screenOn.value = false;
    }

    return;
  }

  // stop screen share
  try {
    // stop screen tracks and remove them from localStream; do not touch camera tracks
    if (screenStream.value) {
      try {
        for (const t of screenStream.value.getTracks()) t.stop();
      } catch (e) {}
      try {
        const sTracks = Array.from(
          (screenStream.value && screenStream.value.getVideoTracks()) || []
        );
        if (localStream.value) {
          for (const st of sTracks) {
            try {
              localStream.value.removeTrack(st);
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
      screenStream.value = null;
    }
    // Restore preview to camera stream if camera is on, otherwise to localStream (may be null)
    if (localCameraVideoRef.value) {
      try {
        if (cameraOn.value && localStream.value)
          localCameraVideoRef.value.srcObject = localStream.value;
        else localCameraVideoRef.value.srcObject = localStream.value || null;
      } catch (e) {}
    }

    // restore camera track if available, otherwise remove video sending
    for (const [remoteId, pc] of Object.entries(peers)) {
      try {
        const camTrack = localStream.value?.getVideoTracks()[0] ?? null;
        const stx = transceiversMap[remoteId]?.screen as
          | RTCRtpTransceiver
          | undefined;
        if (
          stx &&
          (stx as any).sender &&
          typeof (stx as any).sender.replaceTrack === "function"
        ) {
          try {
            // If camera available, replace screen sender with camera track (so remote still sees camera); otherwise set to null
            await (stx as any).sender.replaceTrack(camTrack as any);
            try {
              (stx as any).direction = camTrack ? "sendrecv" : "recvonly";
            } catch (e) {}
          } catch (e) {
            console.warn(
              "toggleScreenShare: failed to replace on screen transceiver during stop",
              e
            );
          }
        } else {
          // fallback: replace any video sender
          const senders = pc.getSenders();
          const vidSender = senders.find(
            (s) => s.track && s.track.kind === "video"
          );
          if (
            vidSender &&
            typeof (vidSender as any).replaceTrack === "function"
          ) {
            try {
              await (vidSender as any).replaceTrack(camTrack as any);
            } catch (e) {
              console.warn(
                "toggleScreenShare: replaceTrack to camera failed",
                e
              );
            }
          }
        }

        // renegotiate
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketDebugEvents.value.unshift({
            t: Date.now(),
            event: "screen-stop-reneg-offer",
            payload: { to: remoteId, sdp: offer.sdp?.slice(0, 2000) },
          });
          if (socketDebugEvents.value.length > 20)
            socketDebugEvents.value.pop();
          ws.sendMessage("signal", {
            type: "offer",
            payload: offer,
            to: remoteId,
          });
        } catch (e) {
          console.warn(
            "toggleScreenShare: renegotiate after stop failed",
            remoteId,
            e
          );
        }
      } catch (e) {
        console.warn(
          "toggleScreenShare: error while stopping for peer",
          remoteId,
          e
        );
      }
    }

    try {
      const roomId =
        props.channelId || (props.currentChannel as any)?.id || null;
      ws.sendMessage("screen-presence", {
        roomId,
        socketId: wsStore.connection?.id,
        isSharing: false,
      });
      // if camera is off, let others know we no longer have video
      if (!cameraOn.value)
        ws.sendMessage("video-presence", {
          roomId,
          socketId: wsStore.connection?.id,
          hasVideo: false,
        });
    } catch (e) {}
  } catch (e) {
    console.warn("toggleScreenShare: error stopping", e);
  }
}

async function joinVoice() {
  if (!props.currentChannel && !props.channelId) return;
  const roomId = props.channelId || (props.currentChannel as any)?.id || "";
  if (!roomId) return;

  await startLocalMedia();

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
  // Notify others about our current camera state so avatar visibility syncs
  try {
    const roomId = props.channelId || (props.currentChannel as any)?.id || null;
    ws.sendMessage("video-presence", {
      roomId,
      socketId: wsStore.connection?.id,
      hasVideo: !!cameraOn.value,
    });
  } catch (e) {
    // ignore
  }
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

  // Ensure camera state reset and notify others that we no longer have video
  try {
    if (cameraOn.value) {
      cameraOn.value = false;
    }
    // Stop and remove local video tracks if any
    if (localStream.value) {
      try {
        for (const t of localStream.value.getVideoTracks()) {
          try {
            t.stop();
          } catch (e) {}
          try {
            localStream.value.removeTrack(t);
          } catch (e) {}
        }
      } catch (e) {
        /* ignore */
      }
    }

    if (localCameraVideoRef.value) {
      try {
        localCameraVideoRef.value.srcObject = null;
      } catch (e) {}
    }

    // notify server that we have no video anymore
    try {
      if (wsStore.isWebSocketConnected) {
        const roomIdNotify =
          props.channelId || (props.currentChannel as any)?.id || null;
        ws.sendMessage("video-presence", {
          roomId: roomIdNotify,
          hasVideo: false,
        });
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
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
    if (remoteHasVideo[id]) delete remoteHasVideo[id];
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
  // Cleanup video element if present
  const videoEl = remoteVideoElements[socketId];
  if (videoEl) {
    try {
      (videoEl as HTMLVideoElement).srcObject = null;
    } catch (e) {
      /* ignore */
    }
    delete remoteVideoElements[socketId];
  }
  // clear remote video flag
  if (remoteHasVideo[socketId]) delete remoteHasVideo[socketId];
  if (remoteIsSharingScreen[socketId]) delete remoteIsSharingScreen[socketId];
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

function handleVideoPresence(payload: any) {
  console.debug("socket event: video-presence", payload);
  socketDebugEvents.value.unshift({
    t: Date.now(),
    event: "video-presence",
    payload,
  });
  if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();

  if (!payload) return;
  const roomId = payload.roomId ?? null;
  const currentRoomId =
    props.channelId || (props.currentChannel as any)?.id || null;
  if (roomId && currentRoomId && String(roomId) !== String(currentRoomId))
    return;

  const socketId = String(
    payload.socketId ??
      payload.id ??
      payload.from ??
      payload.userId ??
      (payload.user && (payload.user.socketId || payload.user.id)
        ? payload.user.socketId ?? payload.user.id
        : "")
  );
  if (!socketId) return;

  const hasVideo = !!payload.hasVideo;
  remoteHasVideo[socketId] = hasVideo;
  // If payload indicates screen sharing explicitly, mark that as well
  if (payload.isSharing !== undefined) {
    const prev = !!remoteIsSharingScreen[socketId];
    const now = !!payload.isSharing;
    remoteIsSharingScreen[socketId] = now;
    // If sharing state changed, reattach the streams to preferred element
    if (prev !== now) {
      reattachRemoteStreamForUser(socketId);
    }
  }
}

function reattachRemoteStreamForUser(socketId: string) {
  try {
    const incoming = remoteStreams[socketId];
    if (!incoming) return;
    const vidEl = remoteVideoElements[socketId];
    const screenEl = remoteScreenVideoElements[socketId];
    const isSharing = !!remoteIsSharingScreen[socketId];
    if (isSharing && screenEl) {
      try {
        screenEl.srcObject = incoming;
      } catch (e) {
        /* ignore */
      }
      try {
        if (vidEl) vidEl.srcObject = null;
      } catch (e) {
        /* ignore */
      }
    } else if (vidEl) {
      try {
        vidEl.srcObject = incoming;
      } catch (e) {
        /* ignore */
      }
      try {
        if (screenEl) screenEl.srcObject = null;
      } catch (e) {
        /* ignore */
      }
    } else if (screenEl) {
      try {
        screenEl.srcObject = incoming;
      } catch (e) {
        /* ignore */
      }
    }
  } catch (e) {
    /* ignore */
  }
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

  // Simple helper: extract m-line order from SDP offer/answer
  function parseSdpMediaOrder(sdpText: string): string[] {
    try {
      const lines = sdpText.split(/\r?\n/);
      const order: string[] = [];
      for (const l of lines) {
        if (typeof l === "string" && l.startsWith("m=")) {
          // m=<media> <port> <proto> <fmt>
          const parts = l.split(" ");
          if (parts && parts.length > 0 && typeof parts[0] === "string") {
            const p0 = parts[0];
            if (p0.length > 2) {
              const media = p0.slice(2).trim();
              order.push(media);
            }
          }
        }
      }
      return order;
    } catch (e) {
      return [];
    }
  }

  try {
    if (type === "offer") {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
      } catch (err: any) {
        // If the error mentions m-lines order mismatch, attempt to recreate the peer
        // with transceivers in the same order as the offer's m-lines and retry.
        const msg = String(err && err.message ? err.message : err || "");
        if (msg.includes("m-lines") || msg.includes("m-line")) {
          socketDebugEvents.value.unshift({
            t: Date.now(),
            event: "sdp-mline-mismatch",
            payload: { from, message: msg },
          });
          if (socketDebugEvents.value.length > 20)
            socketDebugEvents.value.pop();
          try {
            // Parse incoming SDP to determine m-line order
            const mediaOrder =
              payload && payload.sdp
                ? parseSdpMediaOrder(payload.sdp)
                : undefined;
            // Close and remove existing peer and transceivers for this remote
            try {
              const old = peers[from];
              if (old) old.close();
            } catch (e) {}
            delete peers[from];
            delete transceiversMap[from];
            // Create a new peer with transceivers matching the incoming offer
            const newPc = createPeer(from, false, mediaOrder);
            // setRemoteDescription on the newly created pc
            await newPc.setRemoteDescription(
              new RTCSessionDescription(payload)
            );
            const answer2 = await newPc.createAnswer();
            await newPc.setLocalDescription(answer2);
            ws.sendMessage("signal", {
              type: "answer",
              payload: answer2,
              to: from,
            });
            return;
          } catch (retryErr) {
            console.error(
              "handleSignal: retry after m-line mismatch failed",
              retryErr
            );
            socketDebugEvents.value.unshift({
              t: Date.now(),
              event: "sdp-retry-failed",
              payload: {
                from,
                error: String(
                  retryErr && (retryErr as any).message
                    ? (retryErr as any).message
                    : retryErr
                ),
              },
            });
            if (socketDebugEvents.value.length > 20)
              socketDebugEvents.value.pop();
          }
        }
        throw err;
      }
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
    conn.on("video-presence", handleVideoPresence);
    // Some servers emit screen-presence; treat it as video-presence for UI hiding
    conn.on("screen-presence", (p: any) => {
      socketDebugEvents.value.unshift({
        t: Date.now(),
        event: "screen-presence",
        payload: p,
      });
      if (socketDebugEvents.value.length > 20) socketDebugEvents.value.pop();
      try {
        const mapped = {
          roomId: p?.roomId,
          socketId: p?.socketId ?? p?.id ?? p?.from,
          hasVideo: !!p?.isSharing || !!p?.hasVideo,
        };
        handleVideoPresence(mapped);
      } catch (e) {
        console.debug("screen-presence handler error", e);
      }
    });
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
    conn.off("channel-presence", handleChannelPresence);
    conn.off("video-presence", handleVideoPresence);
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
          <div
            class="w-full max-w-7xl flex flex-wrap justify-center items-start gap-4"
          >
            <!-- If no participants, show a friendly empty state with room name + CTA -->
            <template v-if="participants.length === 0">
              <div class="col-span-1 md:col-span-2">
                <div
                  class="relative bg-dark-700 rounded-xl overflow-hidden flex flex-col h-88 items-center justify-center w-[200px]"
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
                class="space-y-4 flex-none"
              >
                <!-- Camera tile -->
                <div
                  v-if="
                    !(
                      (p.local && screenOn) ||
                      (!p.local && remoteIsSharingScreen[p.socketId])
                    )
                  "
                  class="relative bg-dark-700 rounded-xl overflow-hidden flex flex-col h-[250px] w-[400px]"
                >
                  <div
                    class="w-full h-full flex items-center justify-center bg-gray-800 relative overflow-hidden"
                  >
                    <template v-if="p.local">
                      <video
                        v-if="isInVoice"
                        :ref="(el) => setLocalVideoElement(el, 'camera')"
                        autoplay
                        playsinline
                        muted
                        class="absolute inset-0 w-full h-full object-cover"
                      />
                    </template>
                    <template v-else>
                      <video
                        v-if="!p.local"
                        :ref="
                          (el) =>
                            setRemoteVideoElement(el, p.socketId, 'camera')
                        "
                        autoplay
                        playsinline
                        class="absolute inset-0 w-full h-full object-cover"
                      />
                    </template>

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

                    <div
                      v-if="
                        p.local
                          ? !(cameraOn || screenOn)
                          : !hasRemoteVideo(p.socketId)
                      "
                      class="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div
                        class="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ring-4 ring-black/60 shadow-lg"
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

                  <div
                    class="absolute left-1/2 transform -translate-x-1/2 bottom-4 bg-black/60 rounded-full px-3 py-1 flex items-center gap-3"
                  >
                    <div class="text-white text-sm font-medium">
                      {{ p.username }}
                    </div>
                  </div>

                  <audio
                    v-if="!p.local"
                    :ref="(el) => setRemoteAudioElement(el, p.socketId)"
                    autoplay
                    playsinline
                    class="hidden"
                  />
                </div>

                <!-- Screen tile (local or remote) -->
                <div
                  v-if="
                    (p.local && screenOn) ||
                    (!p.local && remoteIsSharingScreen[p.socketId])
                  "
                  class="relative bg-dark-700 rounded-xl overflow-hidden flex flex-col h-[250px] w-[400px]"
                >
                  <div
                    class="w-full h-full flex items-center justify-center bg-gray-900 relative overflow-hidden"
                  >
                    <template v-if="p.local">
                      <video
                        v-if="isInVoice && screenOn"
                        :ref="(el) => setLocalVideoElement(el, 'screen')"
                        autoplay
                        playsinline
                        muted
                        class="absolute inset-0 w-full h-full object-cover"
                      />
                    </template>
                    <template v-else>
                      <video
                        v-if="remoteIsSharingScreen[p.socketId]"
                        :ref="
                          (el) =>
                            setRemoteVideoElement(el, p.socketId, 'screen')
                        "
                        autoplay
                        playsinline
                        class="absolute inset-0 w-full h-full object-cover"
                      />
                    </template>
                  </div>
                  <div
                    class="absolute left-1/2 transform -translate-x-1/2 bottom-4 bg-black/60 rounded-full px-3 py-1 text-white text-sm"
                  >
                    {{ p.username }} — Screen
                  </div>
                </div>
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
              :class="{ 'bg-blue-600': cameraOn }"
              @click="toggleCamera()"
              aria-label="Toggle camera"
            >
              <UIcon
                :name="cameraOn ? 'i-lucide-video' : 'i-lucide-video-off'"
                class="w-5 h-5"
              />
            </button>

            <button
              class="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f3136] hover:bg-[#393c40] text-white"
              :class="{ 'bg-yellow-600': screenOn }"
              @click="toggleScreenShare()"
              aria-label="Toggle screen share"
            >
              <UIcon
                :name="screenOn ? 'i-lucide-monitor' : 'i-lucide-tv'"
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
