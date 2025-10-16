import { useWebSocketStore } from "~/stores/websocket/websocket.store";

export function useVoiceChannel() {
  const webSocketStore = useWebSocketStore();
  const { sendMessage } = webSocketStore;
  const socket = webSocketStore.connection;
  const localVideo: any = ref(null);
  const remoteVideo = ref<HTMLVideoElement | null>(null);

  const localStream = ref<MediaStream | null>(null);
  const remoteStreams = ref<{ [key: string]: MediaStream }>({});

  const isVideoEnabled = ref(false);
  const isAudioEnabled = ref(true);

  const usersInRoom = computed(() => webSocketStore.usersInRoom);
  const usersInfo = computed(() => webSocketStore.usersInfo);

  const peers = ref<{ [key: string]: RTCPeerConnection }>({});

  const init = async (roomId: string) => {
    // Get local media
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
    }

    // Disable video tracks initially if video is disabled
    if (!isVideoEnabled.value) {
      localStream.value
        .getVideoTracks()
        .forEach((track) => (track.enabled = false));
    }
    // Request current users in the channel. Pass full room name so we don't double-prefix.
    getRoomUsers(`channel_${roomId}_init`);

    // Join voice channel
    sendMessage("join_room", {
      room: `channel_${roomId}_init`,
      isVideoEnabled: isVideoEnabled.value,
      isAudioEnabled: isAudioEnabled.value,
    });

    if (!socket) return;

    // Listen for user joined
    socket.on(
      "user_joined",
      async (data: {
        socketId: string;
        room: string;
        user?: { avatar?: string; username?: string };
        isVideoEnabled: boolean;
        isAudioEnabled: boolean;
      }) => {
        const newPeerId = data.socketId;
        // Lưu info user
        if (data.user) {
          webSocketStore.usersInfo[newPeerId] = {
            ...data.user,
            isVideoEnabled: false,
            isAudioEnabled: false,
          };
        }
        if (newPeerId !== socket.id) {
          const pc = createPeerConnection(newPeerId);
          peers.value[newPeerId] = pc;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendMessage("signal", {
            to: newPeerId,
            signal: { type: "offer", sdp: offer.sdp },
          });
        }
        webSocketStore.usersInRoom.push(data.socketId);
        webSocketStore.usersInRoom = [...webSocketStore.usersInRoom];
      }
    );

    // Listen for answer
    socket.on("signal", async (data) => {
      const { from, signal } = data;
      let pc = peers.value[from];
      if (!pc) {
        pc = createPeerConnection(from);
        peers.value[from] = pc;
      }

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendMessage("signal", { to: from, signal: answer });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    //tonggle video
    socket.on(
      "toggle_video",
      (data: { from: string; isVideoEnabled: boolean }) => {
        if (data.from && webSocketStore.usersInfo[data.from]) {
          webSocketStore.usersInfo[data.from]!.isVideoEnabled =
            data.isVideoEnabled;
          webSocketStore.usersInfo = { ...webSocketStore.usersInfo };
        }
      }
    );

    //user left
    socket.on("user_left", (data: { socketId: string; room: string }) => {
      const socketId = data.socketId;
      if (peers.value[socketId]) peers.value[socketId].close();
      delete peers.value[socketId];
      delete remoteStreams.value[socketId];
      delete webSocketStore.usersInfo[socketId]; // Xóa info user

      webSocketStore.usersInRoom = webSocketStore.usersInRoom.filter(
        (id) => id !== socketId
      );
    });
  };

  const createPeerConnection = (socketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: [
            "turn:openrelay.metered.ca:80",
            "turn:openrelay.metered.ca:443",
            "turns:openrelay.metered.ca:443",
          ],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });

    if (localStream.value) {
      localStream.value
        .getTracks()
        .forEach((track) =>
          pc.addTrack(track, localStream.value as MediaStream)
        );
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        remoteStreams.value[socketId] = event.streams[0];
        if (remoteVideo.value) {
          remoteVideo.value.srcObject = event.streams[0];
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage("signal", {
          to: socketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
    };

    return pc;
  };

  const toggleVideo = (channelId: string) => {
    isVideoEnabled.value = !isVideoEnabled.value;
    if (localStream.value) {
      localStream.value.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled.value;
      });
    }

    sendMessage("toggle_video", {
      from: `channel_${channelId}`,
      isVideoEnabled: isVideoEnabled.value,
    });
  };

  const toggleAudio = () => {
    isAudioEnabled.value = !isAudioEnabled.value;
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled.value;
      });
    }
  };

  // send the exact room string the server expects (caller should provide full room name)
  const getRoomUsers = (room: string) => {
    sendMessage("get_room_users", { room });
  };

  const leave = (channelId: string) => {
    // Close all peers
    Object.values(peers.value).forEach((pc) => pc.close());
    peers.value = {};
    remoteStreams.value = {};
    // Stop local stream
    if (localStream.value) {
      localStream.value.getTracks().forEach((track) => track.stop());
      localStream.value = null;
    }

    // Remove self from users in room
    webSocketStore.usersInRoom = webSocketStore.usersInRoom.filter(
      (id) => id !== socket?.id
    );

    // Send leave message
    sendMessage("leave_room", { room: `channel_${channelId}_init` });
  };

  return {
    init,
    leave,
    localStream,
    remoteStreams,
    remoteVideo,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    usersInRoom,
    usersInfo,
    getRoomUsers,
  };
}
